/**
 * BookingScreen
 * Date-range picker, booking type toggle (Instant / Request), cost summary.
 * Submits to /bookings/ → navigates to PaymentScreen on success.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { format, addDays, differenceInCalendarDays, isBefore, startOfDay } from 'date-fns';
import { Colors, FontFamily, FontSize, Radius, Shadow, Spacing } from '../../constants';
import { useApi } from '../../hooks/useApi';
import { useMutation } from '../../hooks/useApi';
import { BillboardAPI, BookingAPI } from '../../services/api';
import { GreenHeader } from '../../components/common/GreenHeader';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import type { AdvertiserStackParamList } from '../../types';

type Props = NativeStackScreenProps<AdvertiserStackParamList, 'Booking'>;

const PLATFORM_FEE_RATE = 0.12; // 12%

export default function BookingScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { billboardId } = route.params;

  const { data: billboard } = useApi(
    () => BillboardAPI.detail(billboardId),
    [billboardId]
  );

  const [bookingType, setBookingType] = useState<'instant' | 'request'>('instant');
  const [startDate,   setStartDate]   = useState<Date | null>(null);
  const [endDate,     setEndDate]     = useState<Date | null>(null);
  const [selectingEnd,setSelectingEnd]= useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const { trigger: createBooking, isLoading } = useMutation(BookingAPI.create);

  // ── Calendar (simple 30-day grid from today) ─────────────────────────────
  const today   = startOfDay(new Date());
  const calDays = Array.from({ length: 42 }, (_, i) => addDays(today, i));

  const handleDayPress = (day: Date) => {
    if (!startDate || selectingEnd === false) {
      setStartDate(day);
      setEndDate(null);
      setSelectingEnd(true);
    } else {
      if (isBefore(day, startDate)) {
        setStartDate(day);
        setEndDate(null);
      } else {
        setEndDate(day);
        setSelectingEnd(false);
      }
    }
  };

  const dayState = (day: Date): 'start' | 'end' | 'in-range' | 'disabled' | null => {
    if (isBefore(day, today)) return 'disabled';
    if (startDate && day.toDateString() === startDate.toDateString()) return 'start';
    if (endDate   && day.toDateString() === endDate.toDateString())   return 'end';
    if (startDate && endDate && day > startDate && day < endDate)     return 'in-range';
    return null;
  };

  // ── Cost calculation ──────────────────────────────────────────────────────
  const { totalDays, subtotal, fee, total } = useMemo(() => {
    if (!startDate || !endDate || !billboard) return { totalDays:0, subtotal:0, fee:0, total:0 };
    const days      = differenceInCalendarDays(endDate, startDate) + 1;
    const sub       = days * billboard.dailyRateUsd;
    const platformF = sub * PLATFORM_FEE_RATE;
    return { totalDays: days, subtotal: sub, fee: platformF, total: sub + platformF };
  }, [startDate, endDate, billboard]);

  const canBook = !!startDate && !!endDate && totalDays >= (billboard?.minBookingDays ?? 1);

  const handleBook = async () => {
    if (!canBook || !startDate || !endDate) return;
    setError(null);
    const booking = await createBooking({
      billboard_id: billboardId,
      booking_type: bookingType,
      start_date:   format(startDate, 'yyyy-MM-dd'),
      end_date:     format(endDate, 'yyyy-MM-dd'),
    });
    if (booking) {
      navigation.navigate('Payment', { bookingId: booking.id });
    } else {
      setError('Could not create booking. Please try again.');
    }
  };

  return (
    <View style={styles.root}>
      <GreenHeader
        title="Book Billboard"
        subtitle={billboard?.title}
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Booking type toggle ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Booking Type</Text>
          <View style={styles.toggle}>
            {(['instant', 'request'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.toggleItem, bookingType === t && styles.toggleActive]}
                onPress={() => setBookingType(t)}
              >
                <Text style={[styles.toggleText, bookingType === t && styles.toggleTextActive]}>
                  {t === 'instant' ? '⚡ Instant Book' : '📋 Request'}
                </Text>
                <Text style={[styles.toggleSub, bookingType === t && styles.toggleSubActive]}>
                  {t === 'instant' ? 'Confirmed immediately' : 'Owner must approve'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Calendar ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Select Dates</Text>
          {startDate && (
            <Text style={styles.dateRange}>
              {format(startDate, 'dd MMM yyyy')}
              {endDate ? ` → ${format(endDate, 'dd MMM yyyy')}` : ' → pick end date'}
            </Text>
          )}

          {/* Day-of-week header */}
          <View style={styles.calHeader}>
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map((d) => (
              <Text key={d} style={styles.calHeaderCell}>{d}</Text>
            ))}
          </View>

          {/* Day grid — 6 weeks */}
          {Array.from({ length: 6 }, (_, week) => (
            <View key={week} style={styles.calWeek}>
              {calDays.slice(week * 7, week * 7 + 7).map((day, di) => {
                const state = dayState(day);
                return (
                  <TouchableOpacity
                    key={di}
                    style={[
                      styles.calCell,
                      state === 'start'    && styles.calStart,
                      state === 'end'      && styles.calEnd,
                      state === 'in-range' && styles.calInRange,
                      state === 'disabled' && styles.calDisabled,
                    ]}
                    onPress={() => state !== 'disabled' && handleDayPress(day)}
                    disabled={state === 'disabled'}
                  >
                    <Text style={[
                      styles.calDay,
                      (state === 'start' || state === 'end') && styles.calDayActive,
                      state === 'disabled' && styles.calDayDisabled,
                    ]}>
                      {format(day, 'd')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

          {billboard && totalDays > 0 && totalDays < billboard.minBookingDays && (
            <Text style={styles.minNote}>
              ⚠️ Minimum {billboard.minBookingDays} days required
            </Text>
          )}
        </View>

        {/* ── Cost summary ── */}
        {canBook && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Cost Summary</Text>
            <View style={styles.costRows}>
              <CostRow label={`$${billboard!.dailyRateUsd.toLocaleString()} × ${totalDays} days`} value={`$${subtotal.toLocaleString()}`} />
              <CostRow label="Platform fee (12%)" value={`$${Math.round(fee).toLocaleString()}`} />
              <View style={styles.divider} />
              <CostRow label="Total" value={`$${Math.round(total).toLocaleString()}`} bold />
            </View>
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

      </ScrollView>

      {/* ── Sticky CTA ── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.base }]}>
        <PrimaryButton
          label={bookingType === 'instant' ? 'Proceed to Payment' : 'Submit Request'}
          onPress={handleBook}
          isLoading={isLoading}
          disabled={!canBook}
        />
      </View>
    </View>
  );
}

function CostRow({ label, value, bold = false }: { label:string; value:string; bold?:boolean }) {
  return (
    <View style={rowStyles.row}>
      <Text style={[rowStyles.label, bold && rowStyles.bold]}>{label}</Text>
      <Text style={[rowStyles.value, bold && rowStyles.bold]}>{value}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row:   { flexDirection:'row', justifyContent:'space-between', paddingVertical: 4 },
  label: { fontFamily: FontFamily.inter,       fontSize: FontSize.base, color: Colors.mid },
  value: { fontFamily: FontFamily.inter,       fontSize: FontSize.base, color: Colors.dark },
  bold:  { fontFamily: FontFamily.interSemiBold, fontSize: FontSize.md, color: Colors.dark },
});

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.offWhite },
  scroll: { padding: Spacing.base, paddingBottom: Spacing['4xl'] },

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

  toggle: {
    flexDirection: 'row',
    gap:           Spacing.sm,
  },
  toggleItem: {
    flex:             1,
    borderWidth:      1.5,
    borderColor:      Colors.border,
    borderRadius:     Radius.md,
    padding:          Spacing.md,
    alignItems:       'center',
  },
  toggleActive: {
    borderColor:      Colors.green,
    backgroundColor:  Colors.greenXLight,
  },
  toggleText: {
    fontFamily: FontFamily.interSemiBold,
    fontSize:   FontSize.base,
    color:      Colors.mid,
  },
  toggleTextActive: { color: Colors.green },
  toggleSub: {
    fontFamily: FontFamily.inter,
    fontSize:   FontSize.xs,
    color:      Colors.muted,
    marginTop:  2,
    textAlign:  'center',
  },
  toggleSubActive: { color: Colors.green },

  dateRange: {
    fontFamily:   FontFamily.interSemiBold,
    fontSize:     FontSize.base,
    color:        Colors.green,
    marginBottom: Spacing.md,
  },

  calHeader: {
    flexDirection:  'row',
    marginBottom:   Spacing.xs,
  },
  calHeaderCell: {
    flex:       1,
    textAlign:  'center',
    fontFamily: FontFamily.interSemiBold,
    fontSize:   FontSize.xs,
    color:      Colors.muted,
  },
  calWeek: { flexDirection: 'row' },
  calCell: {
    flex:           1,
    height:         40,
    alignItems:     'center',
    justifyContent: 'center',
    borderRadius:   Radius.sm,
    margin:         1,
  },
  calStart:   { backgroundColor: Colors.green },
  calEnd:     { backgroundColor: Colors.green },
  calInRange: { backgroundColor: Colors.greenLight },
  calDisabled:{ opacity: 0.3 },
  calDay:     { fontFamily: FontFamily.interMedium, fontSize: FontSize.sm, color: Colors.dark },
  calDayActive:   { color: Colors.white, fontFamily: FontFamily.interSemiBold },
  calDayDisabled: { color: Colors.muted },

  minNote: {
    fontFamily: FontFamily.inter,
    fontSize:   FontSize.sm,
    color:      Colors.warning,
    marginTop:  Spacing.sm,
  },

  costRows: { gap: 2 },
  divider:  { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },

  error: {
    fontFamily: FontFamily.inter,
    fontSize:   FontSize.sm,
    color:      Colors.error,
    textAlign:  'center',
    marginBottom: Spacing.base,
  },

  footer: {
    paddingHorizontal: Spacing.base,
    paddingTop:        Spacing.base,
    backgroundColor:   Colors.white,
    borderTopWidth:    1,
    borderTopColor:    Colors.border,
  },
});
