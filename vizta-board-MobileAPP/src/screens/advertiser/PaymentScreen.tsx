/**
 * PaymentScreen
 * Stripe PaymentIntents flow: create intent → collect card (CardField) → confirm.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useStripe, CardField } from '@stripe/stripe-react-native';
import { Colors, FontFamily, FontSize, Radius, Shadow, Spacing } from '../../constants';
import { BookingAPI, PaymentAPI } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import { GreenHeader } from '../../components/common/GreenHeader';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import type { AdvertiserStackParamList } from '../../types';

type Props = NativeStackScreenProps<AdvertiserStackParamList, 'Payment'>;

export default function PaymentScreen({ navigation, route }: Props) {
  const insets           = useSafeAreaInsets();
  const { confirmPayment } = useStripe();
  const { bookingId }    = route.params;

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [isPaying,     setIsPaying]     = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [success,      setSuccess]      = useState(false);

  const { data: booking } = useApi(
    () => BookingAPI.detail(bookingId),
    [bookingId]
  );

  // Fetch payment intent on mount
  useEffect(() => {
    PaymentAPI.createIntent(bookingId).then(({ clientSecret: cs }) => {
      setClientSecret(cs);
    }).catch((err) => {
      setError(err.message ?? 'Could not initialise payment.');
    });
  }, [bookingId]);

  const handlePay = async () => {
    if (!clientSecret || !cardComplete) return;
    try {
      setIsPaying(true);
      setError(null);

      const { paymentIntent, error: stripeErr } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
      });

      if (stripeErr) {
        setError(stripeErr.message ?? 'Payment failed.');
      } else if (paymentIntent?.status === 'Succeeded') {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err?.message ?? 'Payment failed.');
    } finally {
      setIsPaying(false);
    }
  };

  // ── Success state ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <View style={styles.successWrap}>
        <Text style={styles.successIcon}>✅</Text>
        <Text style={styles.successTitle}>Payment Successful!</Text>
        <Text style={styles.successBody}>
          Your booking has been confirmed. Check your campaigns dashboard for details.
        </Text>
        <PrimaryButton
          label="Go to Campaigns"
          onPress={() => navigation.navigate('BrowseTab')}
          fullWidth={false}
          style={{ paddingHorizontal: Spacing['2xl'] }}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <GreenHeader
        title="Payment"
        subtitle={booking?.billboard?.title}
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Order summary ── */}
        {booking && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Order Summary</Text>
            <SummaryRow label="Billboard"   value={booking.billboard?.title ?? '—'} />
            <SummaryRow label="Period"      value={`${booking.startDate} → ${booking.endDate}`} />
            <SummaryRow label="Duration"    value={`${booking.totalDays} days`} />
            <SummaryRow label="Subtotal"    value={`$${booking.subtotalUsd.toLocaleString()}`} />
            <SummaryRow label="Platform fee" value={`$${booking.platformFeeUsd.toLocaleString()}`} />
            <View style={styles.divider} />
            <SummaryRow label="Total"       value={`$${booking.totalAmountUsd.toLocaleString()}`} bold />
          </View>
        )}

        {/* ── Card input ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Method</Text>
          {!clientSecret ? (
            <ActivityIndicator color={Colors.green} style={{ paddingVertical: Spacing.xl }} />
          ) : (
            <CardField
              postalCodeEnabled={false}
              onCardChange={(details) => setCardComplete(details.complete)}
              style={styles.cardField}
              cardStyle={{
                backgroundColor: Colors.offWhite,
                textColor:       Colors.dark,
                borderRadius:    Radius.md,
                borderWidth:     1.5,
                borderColor:     Colors.border,
              }}
            />
          )}
        </View>

        {/* ── Payment info notes ── */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>🔒 Payments are processed securely via Stripe. Your card details are never stored on our servers.</Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

      </ScrollView>

      {/* ── Pay CTA ── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.base }]}>
        <PrimaryButton
          label={`Pay $${booking ? booking.totalAmountUsd.toLocaleString() : '…'}`}
          onPress={handlePay}
          isLoading={isPaying}
          disabled={!cardComplete || !clientSecret || !booking}
        />
      </View>
    </View>
  );
}

function SummaryRow({ label, value, bold = false }: { label:string; value:string; bold?:boolean }) {
  return (
    <View style={rStyles.row}>
      <Text style={[rStyles.label, bold && rStyles.bold]}>{label}</Text>
      <Text style={[rStyles.value, bold && rStyles.bold]}>{value}</Text>
    </View>
  );
}

const rStyles = StyleSheet.create({
  row:   { flexDirection:'row', justifyContent:'space-between', paddingVertical: 5 },
  label: { fontFamily: FontFamily.inter,       fontSize: FontSize.base, color: Colors.mid, flex:1 },
  value: { fontFamily: FontFamily.inter,       fontSize: FontSize.base, color: Colors.dark, textAlign:'right', flex:1 },
  bold:  { fontFamily: FontFamily.interSemiBold, fontSize: FontSize.md, color: Colors.dark },
});

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: Colors.offWhite },
  scroll:      { padding: Spacing.base, paddingBottom: Spacing['4xl'] },

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

  cardField: { width: '100%', height: 50 },

  infoBox: {
    backgroundColor: Colors.infoBg,
    borderRadius:    Radius.md,
    padding:         Spacing.md,
    marginBottom:    Spacing.base,
  },
  infoText: {
    fontFamily: FontFamily.inter,
    fontSize:   FontSize.sm,
    color:      Colors.info,
    lineHeight: FontSize.sm * 1.5,
  },

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

  successWrap: {
    flex:           1,
    backgroundColor:Colors.white,
    alignItems:     'center',
    justifyContent: 'center',
    padding:        Spacing['2xl'],
    gap:            Spacing.base,
  },
  successIcon:  { fontSize: 64, marginBottom: Spacing.base },
  successTitle: {
    fontFamily: FontFamily.nunitoExtraBold,
    fontSize:   FontSize['2xl'],
    color:      Colors.success,
    textAlign:  'center',
  },
  successBody: {
    fontFamily: FontFamily.inter,
    fontSize:   FontSize.base,
    color:      Colors.mid,
    textAlign:  'center',
    lineHeight: FontSize.base * 1.6,
    marginBottom: Spacing.lg,
  },
});
