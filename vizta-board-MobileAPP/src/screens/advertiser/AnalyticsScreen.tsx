/**
 * AnalyticsScreen — Advertiser tab
 * Campaign-level KPIs + a simple bar chart of impressions over time.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Radius, Shadow, Spacing } from '../../constants';
import { useApi } from '../../hooks/useApi';
import { CampaignAPI } from '../../services/api';
import { GreenHeader } from '../../components/common/GreenHeader';
import { KPITile } from '../../components/common/KPITile';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W - Spacing.base * 2 - Spacing.base * 2; // card padding

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  const { data: campaignsPage } = useApi(() => CampaignAPI.list({ status: 'active' }), []);
  const campaigns = campaignsPage?.results ?? [];

  // Pick first campaign by default
  const activeCampaignId = selectedCampaignId ?? campaigns[0]?.id ?? null;

  const today     = new Date();
  const fromDate  = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const toDate    = today.toISOString().split('T')[0];

  const { data: analytics } = useApi(
    () => activeCampaignId
      ? CampaignAPI.analytics(activeCampaignId, fromDate, toDate)
      : Promise.resolve(null),
    [activeCampaignId, fromDate, toDate],
    !activeCampaignId
  );

  const maxImpression = analytics
    ? Math.max(...(analytics.impressions ?? [1]), 1)
    : 1;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <GreenHeader title="Analytics" subtitle="Campaign Performance" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Campaign selector ── */}
        {campaigns.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.campaignScroll}>
            {campaigns.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.campaignPill, activeCampaignId === c.id && styles.campaignPillActive]}
                onPress={() => setSelectedCampaignId(c.id)}
              >
                <Text style={[styles.campaignPillText, activeCampaignId === c.id && styles.campaignPillTextActive]}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* ── KPI tiles ── */}
        <View style={styles.kpiRow}>
          <KPITile
            label="Total Impressions"
            value={analytics ? `${(analytics.totalImpressions / 1000).toFixed(0)}K` : '—'}
            sub="this month"
            accent={Colors.green}
            style={{ flex: 1 }}
          />
          <KPITile
            label="Avg Daily Reach"
            value={analytics ? `${(analytics.avgDailyReach / 1000).toFixed(1)}K` : '—'}
            sub="unique views"
            accent={Colors.green}
            style={{ flex: 1 }}
          />
        </View>

        {/* ── Bar chart ── */}
        {analytics && (analytics.impressions ?? []).length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Daily Impressions — {new Date().toLocaleString('default',{month:'long', year:'numeric'})}</Text>
            <View style={styles.chart}>
              {analytics.impressions.map((val, i) => {
                const barH = Math.max(4, (val / maxImpression) * 160);
                return (
                  <View key={i} style={styles.barWrap}>
                    <View style={[styles.bar, { height: barH }]} />
                    {(i % 5 === 0) && (
                      <Text style={styles.barLabel}>
                        {analytics.dates[i] ? new Date(analytics.dates[i]).getDate() : ''}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
            <View style={styles.chartLegend}>
              <View style={styles.legendDot} />
              <Text style={styles.legendText}>Impressions</Text>
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Daily Impressions</Text>
            <Text style={styles.noData}>No active campaign data available.</Text>
          </View>
        )}

        {/* ── Occupancy summary ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Occupancy Overview</Text>
          {campaigns.map((c) => (
            <OccupancyBar
              key={c.id}
              label={c.name}
              pct={c.budgetUsd > 0 ? Math.round((c.spentUsd / c.budgetUsd) * 100) : 0}
            />
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

function OccupancyBar({ label, pct }: { label: string; pct: number }) {
  return (
    <View style={oStyles.row}>
      <Text style={oStyles.label} numberOfLines={1}>{label}</Text>
      <View style={oStyles.barBg}>
        <View style={[oStyles.barFill, { width: `${pct}%` }]} />
      </View>
      <Text style={oStyles.pct}>{pct}%</Text>
    </View>
  );
}

const oStyles = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  label:  { fontFamily: FontFamily.interMedium, fontSize: FontSize.sm, color: Colors.dark, width: 100 },
  barBg:  { flex: 1, height: 8, backgroundColor: Colors.border, borderRadius: Radius.pill, overflow: 'hidden' },
  barFill:{ height: '100%', backgroundColor: Colors.green, borderRadius: Radius.pill },
  pct:    { fontFamily: FontFamily.interSemiBold, fontSize: FontSize.sm, color: Colors.green, width: 40, textAlign: 'right' },
});

const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: Colors.offWhite },
  scroll:{ padding: Spacing.base, paddingBottom: Spacing['4xl'] },

  campaignScroll: { paddingBottom: Spacing.md, gap: Spacing.sm },
  campaignPill: {
    borderRadius:     Radius.pill,
    borderWidth:      1.5,
    borderColor:      Colors.border,
    paddingVertical:  Spacing.xs + 1,
    paddingHorizontal:Spacing.base,
    backgroundColor:  Colors.white,
  },
  campaignPillActive:     { borderColor: Colors.green, backgroundColor: Colors.greenXLight },
  campaignPillText:       { fontFamily: FontFamily.interMedium, fontSize: FontSize.sm, color: Colors.mid },
  campaignPillTextActive: { color: Colors.green },

  kpiRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.base },

  card: {
    backgroundColor: Colors.white,
    borderRadius:    Radius.lg,
    padding:         Spacing.base,
    marginBottom:    Spacing.base,
    ...Shadow.card,
  },
  cardTitle: {
    fontFamily:   FontFamily.nunitoBold,
    fontSize:     FontSize.lg,
    color:        Colors.dark,
    marginBottom: Spacing.md,
  },

  chart: {
    flexDirection:  'row',
    alignItems:     'flex-end',
    height:         180,
    gap:            2,
  },
  barWrap: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width:           '70%',
    backgroundColor: Colors.green,
    borderRadius:    Radius.sm,
    opacity:         0.85,
  },
  barLabel: {
    fontFamily: FontFamily.inter,
    fontSize:   7,
    color:      Colors.muted,
    marginTop:  2,
  },
  chartLegend: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.sm },
  legendDot:   { width: 10, height: 10, backgroundColor: Colors.green, borderRadius: 5 },
  legendText:  { fontFamily: FontFamily.inter, fontSize: FontSize.xs, color: Colors.muted },

  noData: { fontFamily: FontFamily.inter, fontSize: FontSize.base, color: Colors.muted, textAlign: 'center', paddingVertical: Spacing.xl },
});
