/**
 * OwnerDashboardScreen — Billboard Owner home tab
 * KPI tiles, pending booking alerts, earnings summary, billboard list.
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
import { useApi, useMutation } from '../../hooks/useApi';
import { OwnerAPI, BookingAPI } from '../../services/api';
import { GreenHeader } from '../../components/common/GreenHeader';
import { KPITile } from '../../components/common/KPITile';
import { StatusPill } from '../../components/common/StatusPill';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { OutlineButton } from '../../components/common/OutlineButton';
import { useAuth } from '../../hooks/useAuth';
import type { Booking } from '../../types';

export default function OwnerDashboardScreen() {
  const insets    = useSafeAreaInsets();
  const { user }  = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { data: dashboard, refetch: refetchDash } = useApi(
    () => OwnerAPI.dashboard(), []
  );
  const { data: pending, refetch: refetchPending } = useApi(
    () => OwnerAPI.pendingBookings(), []
  );

  const today = new Date();
  const { data: earnings } = useApi(
    () => OwnerAPI.earnings(today.getFullYear(), today.getMonth() + 1),
    []
  );

  const { trigger: reviewBooking, isLoading: reviewing } = useMutation(
    ({ id, action }: { id: string; action: 'approve' | 'reject' }) =>
      BookingAPI.review(id, action)
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchDash(), refetchPending()]);
    setRefreshing(false);
  };

  const handleReview = async (booking: Booking, action: 'approve' | 'reject') => {
    await reviewBooking({ id: booking.id, action });
    refetchPending();
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <GreenHeader
        title="Owner Dashboard"
        subtitle={user ? `Welcome, ${user.firstName}` : undefined}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.white} />}
      >

        {/* ── KPI row ── */}
        <View style={styles.kpiRow}>
          <KPITile
            label="Billboards"
            value={String(dashboard?.totalBillboards ?? '—')}
            sub={`${dashboard?.activeBillboards ?? 0} active`}
            accent={Colors.green}
            style={{ flex: 1 }}
          />
          <KPITile
            label="Pending"
            value={String(dashboard?.pendingBookings ?? '—')}
            sub="booking requests"
            accent={dashboard && dashboard.pendingBookings > 0 ? Colors.warning : Colors.dark}
            style={{ flex: 1 }}
          />
        </View>
        <View style={styles.kpiRow}>
          <KPITile
            label="This Month"
            value={earnings ? `$${Math.round(earnings.netEarnings).toLocaleString()}` : '—'}
            sub="net earnings"
            accent={Colors.success}
            style={{ flex: 1 }}
          />
          <KPITile
            label="Occupancy"
            value={dashboard ? `${Math.round(dashboard.occupancyRate)}%` : '—'}
            sub="avg across sites"
            style={{ flex: 1 }}
          />
        </View>

        {/* ── Pending booking alerts ── */}
        {(pending ?? []).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔔 Pending Approval</Text>
            {(pending ?? []).map((b) => (
              <PendingBookingCard
                key={b.id}
                booking={b}
                onApprove={() => handleReview(b, 'approve')}
                onReject={() => handleReview(b, 'reject')}
                isLoading={reviewing}
              />
            ))}
          </View>
        )}

        {/* ── Earnings breakdown ── */}
        {earnings && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Earnings — {earnings.periodLabel}</Text>
            <EarningsRow label="Gross Revenue"       value={`$${Math.round(earnings.grossRevenue).toLocaleString()}`} />
            <EarningsRow label="Platform Commission" value={`-$${Math.round(earnings.platformCommission).toLocaleString()}`} negative />
            <View style={styles.divider} />
            <EarningsRow label="Net Earnings"        value={`$${Math.round(earnings.netEarnings).toLocaleString()}`} bold />
            <View style={styles.divider} />
            <EarningsRow label="Pending Settlement"  value={`$${Math.round(earnings.pendingSettlement).toLocaleString()}`} />
            <EarningsRow label="Paid Out"            value={`$${Math.round(earnings.paidOut).toLocaleString()}`} accent />
          </View>
        )}

      </ScrollView>
    </View>
  );
}

function PendingBookingCard({
  booking,
  onApprove,
  onReject,
  isLoading,
}: {
  booking:    Booking;
  onApprove:  () => void;
  onReject:   () => void;
  isLoading:  boolean;
}) {
  return (
    <View style={styles.pendingCard}>
      <View style={styles.pendingTop}>
        <Text style={styles.pendingBillboard} numberOfLines={1}>
          {booking.billboard?.title ?? 'Billboard'}
        </Text>
        <StatusPill status="pending_approval" small />
      </View>
      <Text style={styles.pendingDates}>
        📅 {booking.startDate} → {booking.endDate}  ({booking.totalDays} days)
      </Text>
      <Text style={styles.pendingAmount}>
        💰 ${booking.totalAmountUsd.toLocaleString()}
      </Text>
      <View style={styles.pendingActions}>
        <PrimaryButton
          label="Approve"
          onPress={onApprove}
          isLoading={isLoading}
          fullWidth={false}
          style={styles.approveBtn}
        />
        <OutlineButton
          label="Reject"
          onPress={onReject}
          isLoading={isLoading}
          fullWidth={false}
          style={styles.rejectBtn}
        />
      </View>
    </View>
  );
}

function EarningsRow({
  label, value, negative = false, bold = false, accent = false,
}: {
  label: string; value: string; negative?: boolean; bold?: boolean; accent?: boolean;
}) {
  return (
    <View style={eStyles.row}>
      <Text style={[eStyles.label, bold && eStyles.bold]}>{label}</Text>
      <Text style={[
        eStyles.value,
        bold && eStyles.bold,
        negative && eStyles.negative,
        accent && eStyles.accent,
      ]}>{value}</Text>
    </View>
  );
}

const eStyles = StyleSheet.create({
  row:      { flexDirection:'row', justifyContent:'space-between', paddingVertical: 5 },
  label:    { fontFamily: FontFamily.inter, fontSize: FontSize.base, color: Colors.mid, flex: 1 },
  value:    { fontFamily: FontFamily.inter, fontSize: FontSize.base, color: Colors.dark, textAlign:'right', flex: 1 },
  bold:     { fontFamily: FontFamily.interSemiBold, fontSize: FontSize.md, color: Colors.dark },
  negative: { color: Colors.error },
  accent:   { color: Colors.success },
});

const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: Colors.offWhite },
  scroll:{ padding: Spacing.base, paddingBottom: Spacing['4xl'] },

  kpiRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },

  section:      { marginBottom: Spacing.base },
  sectionTitle: {
    fontFamily:   FontFamily.nunitoBold,
    fontSize:     FontSize.lg,
    color:        Colors.dark,
    marginBottom: Spacing.sm,
  },

  pendingCard: {
    backgroundColor: Colors.white,
    borderRadius:    Radius.lg,
    padding:         Spacing.base,
    marginBottom:    Spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
    ...Shadow.card,
    gap:             Spacing.xs,
  },
  pendingTop:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pendingBillboard:  { fontFamily: FontFamily.nunitoBold, fontSize: FontSize.md, color: Colors.dark, flex: 1, marginRight: Spacing.sm },
  pendingDates:      { fontFamily: FontFamily.inter, fontSize: FontSize.sm, color: Colors.mid },
  pendingAmount:     { fontFamily: FontFamily.interSemiBold, fontSize: FontSize.base, color: Colors.green },
  pendingActions:    { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  approveBtn:        { flex: 1, paddingVertical: Spacing.sm },
  rejectBtn:         { flex: 1, paddingVertical: Spacing.sm },

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
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
});
