import { useAppTheme, useThemeValue } from '../../theme/ThemeProvider';
import type { ThemeColors } from '../../theme';
import { useState } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { Text, Card, Chip, Appbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAdminCareRequests, useAdminOffers, useAdminContracts, useAdminVisits } from '../../hooks/useAdmin';
import { SPACING, RADIUS } from '../../theme';

type TabType = 'REQUESTS' | 'OFFERS' | 'CONTRACTS' | 'VISITS';

export default function AdminCareOperations() {
  const { colors: COLORS } = useAppTheme();
  const styles = useThemeValue(createStyles);

  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('REQUESTS');

  const { data: requests, isLoading: loadingRequests } = useAdminCareRequests();
  const { data: offers, isLoading: loadingOffers } = useAdminOffers();
  const { data: contracts, isLoading: loadingContracts } = useAdminContracts();
  const { data: visits, isLoading: loadingVisits } = useAdminVisits();

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
        {(
          [
            ['REQUESTS', 'Care Requests'],
            ['OFFERS', 'Marketplace Offers'],
            ['CONTRACTS', 'Contracts'],
            ['VISITS', 'Visits'],
          ] as [TabType, string][]
        ).map(([key, label]) => (
          <Chip
            key={key}
            selected={activeTab === key}
            onPress={() => setActiveTab(key)}
            style={[styles.tab, activeTab === key && styles.activeTab]}
            textStyle={activeTab === key ? styles.activeTabText : styles.tabText}
          >
            {label}
          </Chip>
        ))}
      </ScrollView>
    </View>
  );

  const renderContent = () => {
    if (activeTab === 'REQUESTS') {
      if (loadingRequests) return <ActivityIndicator color={COLORS.navy} style={{ marginTop: 20 }} />;
      if (!requests?.length) return <Text style={styles.emptyText}>No requests found</Text>;
      return requests.map(req => (
        <Card key={req.id} style={styles.card}>
          <Card.Content>
            <View style={styles.row}>
              <Text style={styles.cardTitle}>Req: {req?.id?.slice(0, 8) || 'N/A'}</Text>
              <Chip style={styles.statusChip} textStyle={{ fontSize: 10, color: COLORS.navy, fontWeight: '700' }}>{req.status}</Chip>
            </View>
            <Text style={styles.cardSub}>Service: {(req as any).type || req.serviceType || 'Home Care'}</Text>
            <Text style={styles.cardSub}>Patient: {(req as any)?.patient?.user?.fullName || req?.patientId?.slice(0, 8) || 'N/A'}</Text>
            <Text style={styles.cardSub}>Date: {new Date(req.createdAt).toLocaleDateString()}</Text>
          </Card.Content>
        </Card>
      ));
    }

    if (activeTab === 'OFFERS') {
      if (loadingOffers) return <ActivityIndicator color={COLORS.navy} style={{ marginTop: 20 }} />;
      if (!offers?.length) return <Text style={styles.emptyText}>No offers found</Text>;
      return offers.map(off => (
        <Card key={off.id} style={styles.card}>
          <Card.Content>
            <View style={styles.row}>
              <Text style={styles.cardTitle}>Offer: {off?.id?.slice(0, 8) || 'N/A'}</Text>
              <Chip style={styles.statusChip} textStyle={{ fontSize: 10, color: COLORS.navy, fontWeight: '700' }}>{off.status}</Chip>
            </View>
            <Text style={styles.cardSub}>Nurse: {(off as any)?.nurse?.user?.fullName || (off as any)?.nurseId?.slice(0, 8) || off?.providerId?.slice(0, 8) || 'N/A'}</Text>
            <Text style={styles.cardSub}>Price: PKR {(off as any).price ?? off.amount ?? 'N/A'}{(off as any).priceType ? ` (${(off as any).priceType})` : ''}</Text>
          </Card.Content>
        </Card>
      ));
    }

    if (activeTab === 'CONTRACTS') {
      if (loadingContracts) return <ActivityIndicator color={COLORS.navy} style={{ marginTop: 20 }} />;
      if (!contracts?.length) return <Text style={styles.emptyText}>No contracts found</Text>;
      return contracts.map(con => (
        <Card key={con.id} style={styles.card}>
          <Card.Content>
            <View style={styles.row}>
              <Text style={styles.cardTitle}>Contract: {con?.id?.slice(0, 8)}</Text>
              <Chip style={styles.statusChip} textStyle={{ fontSize: 10, color: COLORS.navy, fontWeight: '700' }}>{con.status}</Chip>
            </View>
            <Text style={styles.cardSub}>Nurse: {(con as any)?.nurse?.user?.fullName || (con as any)?.nurseId?.slice(0, 8) || con?.providerId?.slice(0, 8) || 'N/A'}</Text>
            <Text style={styles.cardSub}>Patient: {(con as any)?.patient?.user?.fullName || con?.patientId?.slice(0, 8) || 'N/A'}</Text>
          </Card.Content>
        </Card>
      ));
    }

    if (activeTab === 'VISITS') {
      if (loadingVisits) return <ActivityIndicator color={COLORS.navy} style={{ marginTop: 20 }} />;
      if (!visits?.length) return <Text style={styles.emptyText}>No visits found</Text>;
      return visits.map(vis => (
        <Card key={vis.id} style={styles.card}>
          <Card.Content>
            <View style={styles.row}>
              <Text style={styles.cardTitle}>Visit: {vis?.id?.slice(0, 8) || 'N/A'}</Text>
              <Chip style={styles.statusChip} textStyle={{ fontSize: 10, color: COLORS.navy, fontWeight: '700' }}>{vis.status}</Chip>
            </View>
            <Text style={styles.cardSub}>Contract ID: {(vis as any)?.sourceContractId?.slice(0, 8) || vis?.contractId?.slice(0, 8) || 'N/A'}</Text>
            <Text style={styles.cardSub}>Patient: {(vis as any)?.request?.patient?.user?.fullName || 'N/A'} · Nurse: {(vis as any)?.nurse?.user?.fullName || 'N/A'}</Text>
            <Text style={styles.cardSub}>Scheduled: {((vis as any).agreedStartTime || (vis as any).startedAt || (vis as any).acceptedAt || vis.scheduledTime) ? new Date((vis as any).agreedStartTime || (vis as any).startedAt || (vis as any).acceptedAt || vis.scheduledTime).toLocaleString() : 'N/A'}</Text>
          </Card.Content>
        </Card>
      ));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={{ backgroundColor: COLORS.navyDark }}>
        <Appbar.BackAction onPress={() => router.back()} color={COLORS.headerText} />
        <Appbar.Content title="Care Operations" titleStyle={{ color: COLORS.headerText, fontWeight: '700' }} />
      </Appbar.Header>

      {renderTabs()}

      <ScrollView contentContainerStyle={styles.content}>
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  tabsContainer: {
    paddingVertical: 10,
    backgroundColor: COLORS.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.inputBorder,
  },
  tabsScroll: { paddingHorizontal: SPACING.md, gap: 8 },
  tab: { backgroundColor: COLORS.surfaceMuted },
  activeTab: { backgroundColor: COLORS.navy },
  tabText: { color: COLORS.textBody, fontWeight: '600' },
  activeTabText: { color: COLORS.onAccent, fontWeight: '700' },
  content: { padding: SPACING.md, gap: 12, paddingBottom: 40 },
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { color: COLORS.textDark, fontSize: 15.5, fontWeight: '700' },
  statusChip: { backgroundColor: COLORS.blueLight },
  cardSub: { color: COLORS.textBody, fontSize: 13, marginTop: 2 },
  emptyText: { color: COLORS.textBody, textAlign: 'center', marginTop: 40, fontSize: 15 },
});
