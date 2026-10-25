/**
 * BillboardDetailScreen
 * Full billboard details: photo gallery, specs, traffic stats, pricing, availability CTA.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors, FontFamily, FontSize, Radius, Shadow, Spacing } from '../../constants';
import { useApi } from '../../hooks/useApi';
import { BillboardAPI } from '../../services/api';
import { StatusPill } from '../../components/common/StatusPill';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import type { AdvertiserStackParamList } from '../../types';

const { width: SCREEN_W } = Dimensions.get('window');
type Props = NativeStackScreenProps<AdvertiserStackParamList, 'BillboardDetail'>;

export default function BillboardDetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { billboardId } = route.params;
  const [photoIdx, setPhotoIdx] = useState(0);

  const { data: billboard, isLoading } = useApi(
    () => BillboardAPI.detail(billboardId),
    [billboardId]
  );

  if (isLoading || !billboard) {
    return (
      <View style={styles.loadingWrap}>
        <Text style={styles.loadingText}>Loading billboard…</Text>
      </View>
    );
  }

  const photos    = billboard.photoUrls ?? [];
  const rateLabel = `$${billboard.dailyRateUsd.toLocaleString()} / day`;
  const sizeLabel = `${billboard.widthFt} × ${billboard.heightFt} ft`;

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Photo gallery ── */}
        <View style={styles.gallery}>
          {photos.length > 0 ? (
            <Image
              source={{ uri: photos[photoIdx] }}
              style={styles.mainPhoto}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.mainPhoto, styles.photoPlaceholder]}>
              <Text style={{ fontSize: 60 }}>🏙️</Text>
            </View>
          )}

          {/* Back button */}
          <TouchableOpacity
            style={[styles.backBtn, { top: insets.top + Spacing.sm }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>

          {/* Thumbnail strip */}
          {photos.length > 1 && (
            <ScrollView
              horizontal
              style={styles.thumbStrip}
              contentContainerStyle={{ gap: Spacing.xs, paddingHorizontal: Spacing.base }}
              showsHorizontalScrollIndicator={false}
            >
              {photos.map((uri, i) => (
                <TouchableOpacity key={i} onPress={() => setPhotoIdx(i)}>
                  <Image
                    source={{ uri }}
                    style={[styles.thumb, i === photoIdx && styles.thumbActive]}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Status + Type badges */}
          <View style={[styles.badgeRow, { top: insets.top + Spacing.sm }]}>
            <StatusPill status={billboard.status as any} />
            {billboard.digital && (
              <View style={styles.digitalBadge}>
                <Text style={styles.digitalText}>Digital</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Content ── */}
        <View style={styles.content}>
          {/* Title + Rate */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>{billboard.title}</Text>
          </View>

          <Text style={styles.location}>
            📍 {billboard.location.area}, {billboard.location.city}, {billboard.location.state}
          </Text>

          {/* Specs grid */}
          <View style={styles.specsGrid}>
            {[
              { icon: '📐', label: 'Size',       value: sizeLabel },
              { icon: '🖼️',  label: 'Format',     value: billboard.format.replace(/_/g,' ') },
              { icon: '💡',  label: 'Illuminated',value: billboard.illuminated ? 'Yes' : 'No' },
              { icon: '🧭',  label: 'Facing',     value: billboard.facingDirection },
              { icon: '📅',  label: 'Min Booking',value: `${billboard.minBookingDays} days` },
              { icon: '👁️',  label: 'Daily Views', value: billboard.trafficStats?.dailyImpressionsAvg
                  ? `${(billboard.trafficStats.dailyImpressionsAvg/1000).toFixed(0)}K`
                  : 'N/A' },
            ].map((s) => (
              <View key={s.label} style={styles.specItem}>
                <Text style={styles.specIcon}>{s.icon}</Text>
                <Text style={styles.specLabel}>{s.label}</Text>
                <Text style={styles.specValue}>{s.value}</Text>
              </View>
            ))}
          </View>

          {/* Description */}
          {billboard.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About this billboard</Text>
              <Text style={styles.desc}>{billboard.description}</Text>
            </View>
          ) : null}

          {/* Traffic stats */}
          {billboard.trafficStats?.demographicNotes ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Audience Insights</Text>
              <Text style={styles.desc}>{billboard.trafficStats.demographicNotes}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* ── Sticky footer ── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.base }]}>
        <View style={styles.footerLeft}>
          <Text style={styles.rate}>{rateLabel}</Text>
          <Text style={styles.rateNote}>excl. platform fee</Text>
        </View>
        <PrimaryButton
          label="Book Now"
          onPress={() => navigation.navigate('Booking', { billboardId: billboard.id })}
          fullWidth={false}
          style={styles.bookBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: Colors.white },
  loadingWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText:  { fontFamily: FontFamily.inter, color: Colors.muted, fontSize: FontSize.base },

  gallery:      { position: 'relative' },
  mainPhoto:    { width: SCREEN_W, height: 280 },
  photoPlaceholder: { backgroundColor: Colors.greenXLight, alignItems: 'center', justifyContent: 'center' },

  backBtn: {
    position:        'absolute',
    left:            Spacing.base,
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  backIcon: { fontSize: 28, color: Colors.dark, marginTop: -2 },

  badgeRow: {
    position: 'absolute',
    right:    Spacing.base,
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  digitalBadge: {
    backgroundColor: Colors.info,
    borderRadius:    Radius.pill,
    paddingVertical: 3,
    paddingHorizontal: Spacing.sm,
  },
  digitalText: {
    fontFamily: FontFamily.interSemiBold,
    fontSize:   FontSize.xs,
    color:      Colors.white,
  },

  thumbStrip:   { backgroundColor: Colors.dark, paddingVertical: Spacing.sm },
  thumb:        { width: 60, height: 44, borderRadius: Radius.sm, opacity: 0.55 },
  thumbActive:  { opacity: 1, borderWidth: 2, borderColor: Colors.green },

  content: { padding: Spacing.base },
  titleRow:{ marginBottom: Spacing.xs },
  title: {
    fontFamily: FontFamily.nunitoExtraBold,
    fontSize:   FontSize['2xl'],
    color:      Colors.dark,
  },
  location: {
    fontFamily:   FontFamily.inter,
    fontSize:     FontSize.sm,
    color:        Colors.muted,
    marginBottom: Spacing.base,
  },

  specsGrid: {
    flexDirection:  'row',
    flexWrap:       'wrap',
    gap:            Spacing.sm,
    marginBottom:   Spacing.base,
  },
  specItem: {
    width:           '30%',
    backgroundColor: Colors.greenXLight,
    borderRadius:    Radius.md,
    padding:         Spacing.md,
    alignItems:      'center',
    gap:             2,
  },
  specIcon:  { fontSize: 20, marginBottom: 2 },
  specLabel: {
    fontFamily: FontFamily.interMedium,
    fontSize:   FontSize.xs,
    color:      Colors.muted,
    textAlign:  'center',
  },
  specValue: {
    fontFamily: FontFamily.nunitoBold,
    fontSize:   FontSize.sm,
    color:      Colors.dark,
    textAlign:  'center',
  },

  section:      { marginBottom: Spacing.base },
  sectionTitle: {
    fontFamily:   FontFamily.nunitoBold,
    fontSize:     FontSize.base,
    color:        Colors.dark,
    marginBottom: Spacing.xs,
  },
  desc: {
    fontFamily: FontFamily.inter,
    fontSize:   FontSize.base,
    color:      Colors.mid,
    lineHeight: FontSize.base * 1.6,
  },

  footer: {
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'space-between',
    paddingHorizontal:Spacing.base,
    paddingTop:       Spacing.base,
    backgroundColor:  Colors.white,
    borderTopWidth:   1,
    borderTopColor:   Colors.border,
    ...Shadow.modal,
  },
  footerLeft: { gap: 2 },
  rate: {
    fontFamily: FontFamily.nunitoExtraBold,
    fontSize:   FontSize.xl,
    color:      Colors.green,
  },
  rateNote: {
    fontFamily: FontFamily.inter,
    fontSize:   FontSize.xs,
    color:      Colors.muted,
  },
  bookBtn: { width: 140 },
});
