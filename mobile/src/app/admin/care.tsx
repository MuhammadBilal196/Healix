
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
        <Chip 
          selected={activeTab === 'REQUESTS'} 
          onPress={() => setActiveTab('REQUESTS')}
          style={[styles.tab, activeTab === 'REQUESTS' && styles.activeTab]}
          textStyle={activeTab === 'REQUESTS' ? styles.activeTabText : styles.tabText}
        >
          Care Requests
        </Chip>
        <Chip 
          selected={activeTab === 'OFFERS'} 
          onPress={() => setActiveTab('OFFERS')}
          style={[styles.tab, activeTab === 'OFFERS' && styles.activeTab]}
          textStyle={activeTab === 'OFFERS' ? styles.activeTabText : styles.tabText}
        >
          Marketplace Offers
        </Chip>
        <Chip 
          selected={activeTab === 'CONTRACTS'} 
          onPress={() => setActiveTab('CONTRACTS')}
          style={[styles.tab, activeTab === 'CONTRACTS' && styles.activeTab]}
          textStyle={activeTab === 'CONTRACTS' ? styles.activeTabText : styles.tabText}
        >
          Contracts
        </Chip>
        <Chip 
          selected={activeTab === 'VISITS'} 
          onPress={() => setActiveTab('VISITS')}
          style={[styles.tab, activeTab === 'VISITS' && styles.activeTab]}
          textStyle={activeTab === 'VISITS' ? styles.activeTabText : styles.tabText}
        >
          Visits
        </Chip>
      </ScrollView>
    </View>
  );

  const renderContent = () => {
    if (activeTab === 'REQUESTS') {
      if (loadingRequests) return <ActivityIndicator color={COLORS.emerald} style={{ marginTop: 20 }} />;
      if (!requests?.length) return <Text style={styles.emptyText}>No requests found</Text>;
      return requests.map(req => (
        <Card key={req.id} style={styles.card}>
          <Card.Content>
            <View style={styles.row}>
              <Text style={styles.cardTitle}>Req: {req?.id?.slice(0, 8) || 'N/A'}</Text>
              <Chip textStyle={{ fontSize: 10 }}>{req.status}</Chip>
            </View>
            <Text style={styles.cardSub}>Service: {req.serviceType}</Text>
            <Text style={styles.cardSub}>Patient: {(req as any)?.patient?.user?.fullName || req?.patientId?.slice(0, 8) || 'N/A'}</Text>
            <Text style={styles.cardSub}>Date: {new Date(req.createdAt).toLocaleDateString()}</Text>
          </Card.Content>
        </Card>
      ));
    }
    
    if (activeTab === 'OFFERS') {
      if (loadingOffers) return <ActivityIndicator color={COLORS.emerald} style={{ marginTop: 20 }} />;
      if (!offers?.length) return <Text style={styles.emptyText}>No offers found</Text>;
      return offers.map(off => (
        <Card key={off.id} style={styles.card}>
          <Card.Content>
            <View style={styles.row}>
              <Text style={styles.cardTitle}>Offer: {off?.id?.slice(0, 8) || 'N/A'}</Text>
              <Chip textStyle={{ fontSize: 10 }}>{off.status}</Chip>
            </View>
            <Text style={styles.cardSub}>Nurse: {(off as any)?.nurse?.user?.fullName || (off as any)?.nurseId?.slice(0, 8) || off?.providerId?.slice(0, 8) || 'N/A'}</Text>
            <Text style={styles.cardSub}>Price: Rs {(off as any).price ?? off.amount ?? 'N/A'}{(off as any).priceType ? ` (${(off as any).priceType})` : ''}</Text>
          </Card.Content>
        </Card>
      ));
    }

    if (activeTab === 'CONTRACTS') {
      if (loadingContracts) return <ActivityIndicator color={COLORS.emerald} style={{ marginTop: 20 }} />;
      if (!contracts?.length) return <Text style={styles.emptyText}>No contracts found</Text>;
      return contracts.map(con => (
        <Card key={con.id} style={styles.card}>
          <Card.Content>
            <View style={styles.row}>
              <Text style={styles.cardTitle}>Contract: {con?.id?.slice(0, 8)}</Text>
              <Chip textStyle={{ fontSize: 10 }}>{con.status}</Chip>
            </View>
            <Text style={styles.cardSub}>Nurse: {(con as any)?.nurse?.user?.fullName || (con as any)?.nurseId?.slice(0, 8) || con?.providerId?.slice(0, 8) || 'N/A'}</Text>
            <Text style={styles.cardSub}>Patient: {(con as any)?.patient?.user?.fullName || con?.patientId?.slice(0, 8) || 'N/A'}</Text>

          </Card.Content>
        </Card>
      ));
    }

    if (activeTab === 'VISITS') {
      if (loadingVisits) return <ActivityIndicator color={COLORS.emerald} style={{ marginTop: 20 }} />;
      if (!visits?.length) return <Text style={styles.emptyText}>No visits found</Text>;
      return visits.map(vis => (
        <Card key={vis.id} style={styles.card}>
          <Card.Content>
            <View style={styles.row}>
              <Text style={styles.cardTitle}>Visit: {vis?.id?.slice(0, 8) || 'N/A'}</Text>
              <Chip textStyle={{ fontSize: 10 }}>{vis.status}</Chip>
            </View>
            <Text style={styles.cardSub}>Contract ID: {vis?.contractId?.slice(0, 8) || 'N/A'}</Text>
            <Text style={styles.cardSub}>Patient: {(vis as any)?.request?.patient?.user?.fullName || 'N/A'} · Nurse: {(vis as any)?.nurse?.user?.fullName || 'N/A'}</Text>
            <Text style={styles.cardSub}>Scheduled: {((vis as any).agreedStartTime || (vis as any).startedAt || (vis as any).acceptedAt || vis.scheduledTime) ? new Date((vis as any).agreedStartTime || (vis as any).startedAt || (vis as any).acceptedAt || vis.scheduledTime).toLocaleString() : 'N/A'}</Text>
          </Card.Content>
        </Card>
      ));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={{ backgroundColor: COLORS.bg }}>
        <Appbar.BackAction onPress={() => router.back()} color={COLORS.textDark} />
        <Appbar.Content title="Care Operations" titleStyle={{ color: COLORS.textDark }} />
      </Appbar.Header>
      
      {renderTabs()}
      
      <ScrollView contentContainerStyle={styles.content}>
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => (StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  tabsContainer: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.emeraldLight },
  tabsScroll: { paddingHorizontal: SPACING.md, gap: 10 },
  tab: { backgroundColor: COLORS.bg },
  activeTab: { backgroundColor: COLORS.emerald },
  tabText: { color: COLORS.textBody },
  activeTabText: { color: COLORS.textMuted, fontWeight: 'bold' },
  content: { padding: SPACING.md, gap: 12, paddingBottom: 40 },
  card: { backgroundColor: COLORS.bg, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.emeraldLight },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { color: COLORS.textDark, fontSize: 16, fontWeight: '700' },
  cardSub: { color: COLORS.textBody, fontSize: 13, marginTop: 2 },
  emptyText: { color: COLORS.textBody, textAlign: 'center', marginTop: 40, fontSize: 16 },
}));
