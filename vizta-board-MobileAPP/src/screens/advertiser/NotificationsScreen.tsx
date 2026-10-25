import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Radius, Shadow, Spacing } from '../../constants';
import { useApi, useMutation } from '../../hooks/useApi';
import { NotificationAPI } from '../../services/api';
import { GreenHeader } from '../../components/common/GreenHeader';
import type { Notification } from '../../types';

const ICON_MAP: Record<string, string> = {
  booking_confirmed: '✅',
  booking_approved:  '🎉',
  booking_rejected:  '❌',
  payment_received:  '💳',
  campaign_started:  '🚀',
  campaign_ended:    '🏁',
  artwork_required:  '🖼️',
  system_alert:      '⚠️',
};

export default function NotificationsScreen() {
  const insets      = useSafeAreaInsets();
  const [refreshing,setRefreshing] = useState(false);

  const { data: page, isLoading, refetch } = useApi(
    () => NotificationAPI.list(),
    []
  );
  const notifications = page?.results ?? [];
  const unreadCount   = notifications.filter((n) => !n.isRead).length;

  const { trigger: markRead }    = useMutation((id: string) => NotificationAPI.markRead(id));
  const { trigger: markAllRead } = useMutation(() => NotificationAPI.markAllRead());

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handlePress = async (n: Notification) => {
    if (!n.isRead) await markRead(n.id);
  };

  const handleMarkAll = async () => {
    await markAllRead(undefined as any);
    refetch();
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <GreenHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : undefined}
        rightElement={
          unreadCount > 0 ? (
            <TouchableOpacity onPress={handleMarkAll}>
              <Text style={styles.markAllBtn}>Mark all read</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      <FlatList
        data={notifications}
        keyExtractor={(n) => n.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.green} />}
        ListEmptyComponent={
          isLoading ? (
            <Text style={styles.loading}>Loading…</Text>
          ) : (
            <View style={styles.empty}>
              <Text style={{ fontSize: 40 }}>🔔</Text>
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptySub}>No notifications yet.</Text>
            </View>
          )
        }
        renderItem={({ item: n }) => (
          <TouchableOpacity
            style={[styles.item, !n.isRead && styles.itemUnread]}
            onPress={() => handlePress(n)}
            activeOpacity={0.75}
          >
            <View style={styles.iconWrap}>
              <Text style={styles.icon}>{ICON_MAP[n.type] ?? '🔔'}</Text>
            </View>
            <View style={styles.textWrap}>
              <Text style={styles.title}>{n.title}</Text>
              <Text style={styles.body} numberOfLines={2}>{n.body}</Text>
              <Text style={styles.time}>{new Date(n.createdAt).toLocaleDateString()}</Text>
            </View>
            {!n.isRead && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.offWhite },
  list: { padding: Spacing.base, paddingBottom: Spacing['4xl'] },

  markAllBtn: {
    fontFamily: FontFamily.interSemiBold,
    fontSize:   FontSize.xs,
    color:      Colors.white,
  },

  item: {
    flexDirection:   'row',
    backgroundColor: Colors.white,
    borderRadius:    Radius.lg,
    padding:         Spacing.base,
    marginBottom:    Spacing.sm,
    alignItems:      'flex-start',
    ...Shadow.card,
  },
  itemUnread: { backgroundColor: Colors.greenXLight },

  iconWrap: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: Colors.greenLight,
    alignItems:      'center',
    justifyContent:  'center',
    marginRight:     Spacing.md,
  },
  icon:    { fontSize: 20 },
  textWrap:{ flex: 1, gap: 3 },
  title: {
    fontFamily: FontFamily.interSemiBold,
    fontSize:   FontSize.base,
    color:      Colors.dark,
  },
  body: {
    fontFamily: FontFamily.inter,
    fontSize:   FontSize.sm,
    color:      Colors.mid,
    lineHeight: FontSize.sm * 1.5,
  },
  time: {
    fontFamily: FontFamily.inter,
    fontSize:   FontSize.xs,
    color:      Colors.muted,
  },
  unreadDot: {
    width:           8,
    height:          8,
    borderRadius:    4,
    backgroundColor: Colors.green,
    marginLeft:      Spacing.sm,
    marginTop:       Spacing.xs,
  },

  loading: { textAlign: 'center', fontFamily: FontFamily.inter, color: Colors.muted, paddingVertical: Spacing['2xl'] },
  empty: { alignItems: 'center', paddingVertical: Spacing['4xl'], gap: Spacing.md },
  emptyTitle: { fontFamily: FontFamily.nunitoBold, fontSize: FontSize.xl, color: Colors.dark },
  emptySub:   { fontFamily: FontFamily.inter, fontSize: FontSize.base, color: Colors.muted },
});
