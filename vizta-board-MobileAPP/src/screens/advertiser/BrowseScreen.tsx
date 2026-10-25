/**
 * BrowseScreen — Advertiser home tab
 * Search + filter billboard inventory, featured row, full list.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  ScrollView,
  Text,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors, FontFamily, FontSize, Spacing } from '../../constants';
import { useApi } from '../../hooks/useApi';
import { BillboardAPI } from '../../services/api';
import { BillboardCard } from '../../components/billboard/BillboardCard';
import { FilterChip } from '../../components/billboard/FilterChip';
import { SearchBar } from '../../components/common/SearchBar';
import type { AdvertiserStackParamList } from '../../types';

type Props = NativeStackScreenProps<AdvertiserStackParamList, 'BrowseTab'>;

const FORMATS = [
  { key: '', label: 'All' },
  { key: 'billboard',    label: 'Billboard' },
  { key: 'digital_led',  label: 'Digital LED' },
  { key: 'gantry',       label: 'Gantry' },
  { key: 'lamp_post',    label: 'Lamp Post' },
  { key: 'transit_shelter', label: 'Transit' },
  { key: 'rooftop',      label: 'Rooftop' },
];

export default function BrowseScreen({ navigation }: Props) {
  const insets      = useSafeAreaInsets();
  const [query,     setQuery]     = useState('');
  const [format,    setFormat]    = useState('');
  const [page,      setPage]      = useState(1);
  const [refreshing,setRefreshing]= useState(false);

  const { data: billboardPage, isLoading, refetch } = useApi(
    () => BillboardAPI.list({ search: query || undefined, format: format || undefined, page }),
    [query, format, page]
  );

  const { data: featured } = useApi(
    () => BillboardAPI.featured(),
    []
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── Header bar ── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.greeting}>Find Billboards 🗺️</Text>
          <Text style={styles.sub}>Across Africa's top markets</Text>
        </View>
        <SearchBar value={query} onChangeText={setQuery} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.green} />}
      >
        {/* ── Format filters ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FORMATS.map((f) => (
            <FilterChip
              key={f.key}
              label={f.label}
              active={format === f.key}
              onPress={() => setFormat(f.key)}
            />
          ))}
        </ScrollView>

        {/* ── Featured row ── */}
        {(featured ?? []).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⭐ Featured</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.base }}>
              {(featured ?? []).map((b) => (
                <BillboardCard
                  key={b.id}
                  billboard={b}
                  compact
                  onPress={() => navigation.navigate('BillboardDetail', { billboardId: b.id })}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── All results ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {billboardPage?.count
              ? `${billboardPage.count} billboard${billboardPage.count !== 1 ? 's' : ''}`
              : 'Billboards'}
          </Text>
          <View style={styles.listWrap}>
            {isLoading && !billboardPage ? (
              <Text style={styles.loading}>Loading…</Text>
            ) : (billboardPage?.results ?? []).length === 0 ? (
              <Text style={styles.empty}>No billboards match your search.</Text>
            ) : (
              (billboardPage?.results ?? []).map((b) => (
                <BillboardCard
                  key={b.id}
                  billboard={b}
                  onPress={() => navigation.navigate('BillboardDetail', { billboardId: b.id })}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.offWhite },
  header: {
    backgroundColor:  Colors.green,
    paddingHorizontal:Spacing.base,
    paddingBottom:    Spacing.base,
    gap:              Spacing.md,
  },
  headerTop: { gap: 2 },
  greeting: {
    fontFamily: FontFamily.nunitoExtraBold,
    fontSize:   FontSize.xl,
    color:      Colors.white,
  },
  sub: {
    fontFamily: FontFamily.inter,
    fontSize:   FontSize.sm,
    color:      'rgba(255,255,255,0.75)',
  },
  filterRow: {
    paddingHorizontal: Spacing.base,
    paddingVertical:   Spacing.md,
  },
  section: { marginBottom: Spacing.lg },
  sectionTitle: {
    fontFamily:       FontFamily.nunitoBold,
    fontSize:         FontSize.lg,
    color:            Colors.dark,
    paddingHorizontal:Spacing.base,
    marginBottom:     Spacing.sm,
  },
  listWrap: { paddingHorizontal: Spacing.base },
  loading:  {
    textAlign:  'center',
    fontFamily: FontFamily.inter,
    fontSize:   FontSize.base,
    color:      Colors.muted,
    paddingVertical: Spacing['2xl'],
  },
  empty: {
    textAlign:  'center',
    fontFamily: FontFamily.inter,
    fontSize:   FontSize.base,
    color:      Colors.muted,
    paddingVertical: Spacing['2xl'],
  },
});
