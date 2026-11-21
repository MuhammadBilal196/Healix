


import { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth';
import { apiClient } from '../api/client';
import { WorkflowPage, useFlowStyles } from '../components/common/WorkflowPage';
import { useAppTheme } from '../theme/ThemeProvider';
import { downloadPrivateFile } from '../utils/fileTransfer';
import { RADIUS, SPACING } from '../theme';

type Report = {
  role: string;
  period: { from: string; to: string; timezone: string };
  metrics: { label: string; value: number | null; unit: string }[];
  tables: { title: string; rows: Record<string, string | number | null>[] }[];
  limitations: string[];
};

export default function Analytics() {
  const s = useFlowStyles();
  const { colors: COLORS } = useAppTheme();

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [period, setPeriod] = useState('');
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const actor = useAuthStore(state => state.user);
  const admin = actor?.role === 'ADMIN';
  const [staffRole, setStaffRole] = useState('NURSE');
  const [staffPage, setStaffPage] = useState(1);
  const [staffUserId, setStaffUserId] = useState('');

  const staff = useQuery({
    queryKey: ['analytics-staff', actor?.id, staffRole, staffPage],
    queryFn: () => apiClient.get<any>(`/admin/users?role=${staffRole}&page=${staffPage}&limit=20`),
    enabled: admin,
  });

  const records = useQuery({
    queryKey: ['analytics', actor?.id, period],
    queryFn: () => apiClient.get<Report>('/analytics/overview' + period),
  });

  const apply = () =>
    setPeriod(
      '?' +
        new URLSearchParams({
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
          ...(admin && staffUserId ? { staffUserId } : {}),
        }).toString()
    );

  const download = async () => {
    setExporting(true);
    setError('');
    try {
      await downloadPrivateFile('/analytics/report.csv' + period, 'Healix_Report.csv');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setExporting(false);
    }
  };

  const inputProps = {
    mode: 'outlined' as const,
    outlineColor: COLORS.inputBorder,
    activeOutlineColor: COLORS.navy,
    textColor: COLORS.textDark,
    style: s.input,
  };

  return (
    <WorkflowPage
      title="Analytics & Reports"
      loading={records.isLoading}
      error={error || records.error?.message}
      retry={() => void records.refetch()}
    >
      <View style={s.card}>
        <Text style={s.subtitle}>DATE RANGE FILTER (UTC)</Text>
        <Text style={s.title}>Reporting Period</Text>
        <Text style={s.body}>Choose a period of up to 366 days, then apply filters or export CSV.</Text>
        <TextInput
          {...inputProps}
          label="From Date (YYYY-MM-DD, optional)"
          placeholder="2026-01-01"
          value={from}
          onChangeText={setFrom}
        />
        <TextInput
          {...inputProps}
          label="To Date (YYYY-MM-DD, optional)"
          placeholder="2026-12-31"
          value={to}
          onChangeText={setTo}
        />
        <View style={s.row}>
          <Button
            mode="contained"
            buttonColor={COLORS.navy}
            textColor={COLORS.onAccent}
            onPress={apply}
          >
            Apply Period
          </Button>
          <Button
            mode="outlined"
            textColor={COLORS.primaryText}
            icon="download-outline"
            disabled={exporting || !records.data}
            loading={exporting}
            onPress={() => void download()}
          >
            Export CSV
          </Button>
        </View>
      </View>

      {admin && (
        <View style={s.card}>
          <Text style={s.subtitle}>ADMIN BENCHMARKING</Text>
          <Text style={s.title}>Staff Performance Monitoring</Text>
          <Text style={s.body}>
            Select a nurse or doctor, then press Apply Period. Clear selection for platform-wide metrics.
          </Text>
          <View style={s.row}>
            {['NURSE', 'DOCTOR'].map(role => (
              <Button
                key={role}
                mode={staffRole === role ? 'contained' : 'outlined'}
                buttonColor={staffRole === role ? COLORS.navy : undefined}
                textColor={staffRole === role ? COLORS.onAccent : COLORS.primaryText}
                onPress={() => {
                  setStaffRole(role);
                  setStaffPage(1);
                  setStaffUserId('');
                }}
              >
                {role}
              </Button>
            ))}
          </View>
          {staff.error && <Text style={{ color: COLORS.red }}>{staff.error.message}</Text>}
          <View style={s.row}>
            {staff.data?.users.map((user: any) => (
              <Button
                key={user.id}
                compact
                mode={staffUserId === user.id ? 'contained' : 'outlined'}
                buttonColor={staffUserId === user.id ? COLORS.navy : undefined}
                textColor={staffUserId === user.id ? COLORS.onAccent : COLORS.primaryText}
                onPress={() => setStaffUserId(user.id)}
              >
                {user.fullName}
              </Button>
            ))}
          </View>
          <View style={s.row}>
            <Button mode="outlined" compact disabled={staffPage === 1} onPress={() => setStaffPage(staffPage - 1)}>
              Prev Staff
            </Button>
            <Text style={s.body}>Page {staffPage}</Text>
            <Button
              mode="outlined"
              compact
              disabled={!staff.data || staffPage * 20 >= staff.data.total}
              onPress={() => setStaffPage(staffPage + 1)}
            >
              Next Staff
            </Button>
            <Button mode="text" compact onPress={() => setStaffUserId('')}>
              Clear
            </Button>
          </View>
        </View>
      )}

      {records.data && (
        <Text style={[s.body, { fontWeight: '700' }]}>
          Active Window: {records.data.period.from} &ndash; {records.data.period.to} ({records.data.role})
        </Text>
      )}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
        {records.data?.metrics.map(item => (
          <View key={item.label} style={[s.card, { width: '48%', padding: SPACING.md }]}>
            <Text style={{ color: COLORS.textMuted, fontSize: 11.5, fontWeight: '700' }}>{item.label}</Text>
            <Text style={{ color: COLORS.navy, fontSize: 20, fontWeight: '800', marginTop: 4 }}>
              {item.value == null ? '—' : `${item.value} ${item.unit}`}
            </Text>
          </View>
        ))}
      </View>

      {records.data?.tables.map(table => (
        <View key={table.title} style={s.card}>
          <Text style={s.title}>{table.title}</Text>
          {table.rows.length === 0 ? (
            <Text style={s.body}>No recorded data for this period.</Text>
          ) : (
            <ScrollView horizontal>
              <View style={{ gap: 6 }}>
                <Text style={{ color: COLORS.primaryText, fontWeight: '800', fontSize: 12 }}>
                  {Object.keys(table.rows[0]).join(' · ')}
                </Text>
                {table.rows.slice(0, 100).map((row, index) => (
                  <View
                    key={index}
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 8,
                      borderRadius: RADIUS.sm,
                      backgroundColor: COLORS.surface,
                    }}
                  >
                    <Text style={s.body}>
                      {Object.values(row)
                        .map(value => value ?? 'No data')
                        .join(' · ')}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
          {table.rows.length > 100 && (
            <Text style={s.body}>Showing 100 of {table.rows.length} rows. The CSV includes the complete report.</Text>
          )}
        </View>
      ))}

      {!!records.data?.limitations.length && (
        <View style={s.card}>
          <Text style={s.subtitle}>DATA LIMITATIONS &amp; SCOPE</Text>
          {records.data.limitations.map(text => (
            <Text key={text} style={s.body}>
              • {text}
            </Text>
          ))}
        </View>
      )}
    </WorkflowPage>
  );
}
