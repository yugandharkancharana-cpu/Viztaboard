import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { Colors, FontFamily, FontSize, Radius, Shadow, Spacing } from '../../constants';
import { StatusPill } from '../common/StatusPill';
import type { Billboard } from '../../types';

interface Props {
  billboard: Billboard;
  onPress:   () => void;
  compact?:  boolean;
}

export function BillboardCard({ billboard, onPress, compact = false }: Props) {
  const photoUri = billboard.photoUrls?.[0];
  const formattedRate = `$${billboard.dailyRateUsd.toLocaleString()}/day`;

  return (
    <TouchableOpacity style={[styles.card, compact && styles.compact]} onPress={onPress} activeOpacity={0.85}>
      {/* Photo */}
      <View style={[styles.imageWrap, compact && styles.imageWrapCompact]}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderIcon}>🏙️</Text>
          </View>
        )}
        {billboard.isFeatured && (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredText}>Featured</Text>
          </View>
        )}
        {billboard.digital && (
          <View style={styles.digitalBadge}>
            <Text style={styles.digitalText}>Digital</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.title} numberOfLines={1}>{billboard.title}</Text>
          <StatusPill status={billboard.status as any} small />
        </View>

        <Text style={styles.location} numberOfLines={1}>
          📍 {billboard.location.area}, {billboard.location.city}
        </Text>

        <View style={styles.specsRow}>
          <Text style={styles.spec}>{billboard.widthFt}×{billboard.heightFt}ft</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.spec}>{billboard.format.replace(/_/g,' ')}</Text>
          {billboard.illuminated && (
            <>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.spec}>💡 Lit</Text>
            </>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.rate}>{formattedRate}</Text>
          {(billboard.trafficStats?.dailyImpressionsAvg ?? 0) > 0 && (
            <Text style={styles.impressions}>
              {(billboard.trafficStats.dailyImpressionsAvg! / 1000).toFixed(0)}K daily
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius:    Radius.lg,
    overflow:        'hidden',
    marginBottom:    Spacing.base,
    ...Shadow.card,
  },
  compact: {
    width: 220,
    marginRight: Spacing.md,
    marginBottom: 0,
  },
  imageWrap: {
    height: 180,
    position: 'relative',
  },
  imageWrapCompact: {
    height: 130,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: Colors.greenXLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: { fontSize: 40 },
  featuredBadge: {
    position:        'absolute',
    top:             Spacing.sm,
    left:            Spacing.sm,
    backgroundColor: Colors.green,
    borderRadius:    Radius.pill,
    paddingVertical: 2,
    paddingHorizontal: Spacing.sm,
  },
  featuredText: {
    fontFamily: FontFamily.interSemiBold,
    fontSize:   FontSize.xs,
    color:      Colors.white,
  },
  digitalBadge: {
    position:        'absolute',
    top:             Spacing.sm,
    right:           Spacing.sm,
    backgroundColor: Colors.info,
    borderRadius:    Radius.pill,
    paddingVertical: 2,
    paddingHorizontal: Spacing.sm,
  },
  digitalText: {
    fontFamily: FontFamily.interSemiBold,
    fontSize:   FontSize.xs,
    color:      Colors.white,
  },
  content: {
    padding: Spacing.base,
  },
  topRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   Spacing.xs,
  },
  title: {
    flex:       1,
    fontFamily: FontFamily.nunitoBold,
    fontSize:   FontSize.md,
    color:      Colors.dark,
    marginRight: Spacing.sm,
  },
  location: {
    fontFamily: FontFamily.inter,
    fontSize:   FontSize.sm,
    color:      Colors.muted,
    marginBottom: Spacing.xs,
  },
  specsRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap: Spacing.xs,
    marginBottom:  Spacing.sm,
  },
  spec: {
    fontFamily: FontFamily.interMedium,
    fontSize:   FontSize.xs,
    color:      Colors.mid,
  },
  dot: {
    color:    Colors.muted,
    fontSize: FontSize.xs,
  },
  footer: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  rate: {
    fontFamily: FontFamily.nunitoExtraBold,
    fontSize:   FontSize.base,
    color:      Colors.green,
  },
  impressions: {
    fontFamily: FontFamily.inter,
    fontSize:   FontSize.xs,
    color:      Colors.muted,
  },
});
