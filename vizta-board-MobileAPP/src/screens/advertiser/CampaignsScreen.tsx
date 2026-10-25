/**
 * CampaignsScreen — Advertiser tab
 * List of all campaigns with status pill, budget progress, quick filters.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Radius, Shadow, Spacing } from '../../constants';
import { useApi } from '../../hooks/useApi';
import { CampaignAPI } from '../../services/api';
import { GreenHeader } from '../../components/common/GreenHeader';
import { StatusPill } from '../../components/common/StatusPill';
import { FilterChip } from '../../components/billboard/FilterChip';
import type { Campaign } from '../../types';

const STATUS_FILTERS = [
  { key: '',          label: 'All' },
  { key: 'active',   label: 'Active' },
  { key: 'draft',    label: 'Draft' },
  { key: 'completed',label: 'Completed' },
  { key: 'paused',   label: 'Paused' },
];

export default function CampaignsScreen() {
  const insets     = useSafeAreaInsets();
  const [status,   setStatus]    = useState('');
  const [refreshing,setRefreshing]= useState(false);

  const { data: page, isLoading, refetch } = useApi(
    () => CampaignAPI.list({ status: status || undefined }),
    [status]
  );

  const campaigns = page?.results ?? [];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <GreenHeader title="My Campaigns" />

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={styles.filterBar}
      >
        {STATUS_FILTERS.map((f) => (
          <FilterChip
            key={f.key}
            label={f.label}
            active={status === f.key}
            onPress={() => setStatus(f.key)}
          />
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => { setRefreshing(true); await refetch(); setRefreshing(false); }}
            tintColor={Colors.green}
          />
        }
      >
        {isLoading && !page ? (
          <Text style={styles.loading}>Loading campaigns…</Text>
        ) : campaigns.length === 0 ? (
          <EmptyState />
        ) : (
          campaigns.map((c) => <CampaignCard key={c.id} campaign={c} />)
        )}
      </ScrollView>
    </View>
  );
}

function CampaignCard({ campaign }: { campaign: Campaign }) {
  const spentPct = campaign.budgetUsd > 0
    ? Math.min((campaign.spentUsd / campaign.budgetUsd) * 100, 100)
    : 0;

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.campaignName} numberOfLines={1}>{campaign.name}</Text>
        <StatusPill status={campaign.status as any} small />
      </View>

      <View style={styles.datesRow}>
        <Text style={styles.dateText}>📅 {campaign.startDate}</Text>
        <Text style={styles.dateText}>→ {campaign.endDate}</Text>
      </View>

      {/* Budget progress */}
      <View style={styles.budgetSection}>
        <View style={styles.budgetLabels}>
          <Text style={styles.budgetLabel}>Budget used</Text>
          <Text style={styles.budgetPct}>{Math.round(spentPct)}%</Text>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${spentPct}%` }]} />
        </View>
        <View style={styles.budgetAmounts}>
          <Text style={styles.budgetAmt}>${campaign.spentUsd.toLocaleString()} spent</Text>
          <Text style={styles.budgetAmt}>${campaign.budgetUsd.toLocaleString()} total</Text>
        </View>
      </View>

      {/* Bookings count */}
      <Text style={styles.bookingsCount}>
        🖼️ {campaign.bookings?.length ?? 0} billboard{(campaign.bookings?.length ?? 0) !== 1 ? 's' : ''}
      </Text>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>📊</Text>
      <Text style={styles.emptyTitle}>No campaigns yet</Text>
      <Text style={styles.emptySub}>Book a billboard to start your first campaign.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.offWhite },

  filterBar:  { backgroundColor: Colors.white, maxHeight: 60 },
  filterRow:  { paddingHorizontal: Spacing.base, paddingVertical: Spacing.md },

  list: { padding: Spacing.base, paddingBottom: Spacing['4xl'] },

  loading: {
    textAlign: 'center', fontFamily: FontFamily.inter, color: Colors.muted,
    fontSize: FontSize.base, paddingVertical: Spacing['2xl'],
  },

  card: {
    backgroundColor: Colors.white,
    borderRadius:    Radius.lg,
    padding:         Spacing.base,
    marginBottom:    Spacing.base,
    ...Shadow.card,
    gap:             Spacing.sm,
  },
  cardTop: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  campaignName: {
    fontFamily: FontFamily.nunitoBold,
    fontSize:   FontSize.md,
    color:      Colors.dark,
    flex:       1,
    marginRight:Spacing.sm,
  },
  datesRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dateText: {
    fontFamily: FontFamily.inter,
    fontSize:   FontSize.sm,
    color:      Colors.muted,
  },
  budgetSection: { gap: Spacing.xs },
  budgetLabels:  { flexDirection: 'row', justifyContent: 'space-between' },
  budgetLabel:   { fontFamily: FontFamily.interMedium, fontSize: FontSize.sm, color: Colors.mid },
  budgetPct:     { fontFamily: FontFamily.interSemiBold, fontSize: FontSize.sm, color: Colors.green },
  progressBg: {
    height:          8,
    backgroundColor: Colors.border,
    borderRadius:    Radius.pill,
    overflow:        'hidden',
  },
  progressFill: {
    height:          '100%',
    backgroundColor: Colors.green,
    borderRadius:    Radius.pill,
  },
  budgetAmounts: { flexDirection: 'row', justifyContent: 'space-between' },
  budgetAmt: { fontFamily: FontFamily.inter, fontSize: FontSize.xs, color: Colors.muted },
  bookingsCount: { fontFamily: FontFamily.inter, fontSize: FontSize.sm, color: Colors.muted },

  empty: { alignItems: 'center', paddingVertical: Spacing['4xl'], gap: Spacing.md },
  emptyIcon:  { fontSize: 48 },
  emptyTitle: { fontFamily: FontFamily.nunitoBold, fontSize: FontSize.xl, color: Colors.dark },
  emptySub:   { fontFamily: FontFamily.inter, fontSize: FontSize.base, color: Colors.muted, textAlign: 'center' },
});
