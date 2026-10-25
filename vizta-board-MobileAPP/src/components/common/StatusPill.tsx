import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '../../constants';

type Status =
  | 'active'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'cancelled'
  | 'draft'
  | 'processing'
  | 'succeeded'
  | 'failed';

const CONFIG: Record<Status, { label: string; fg: string; bg: string }> = {
  active:           { label: 'Active',      fg: Colors.statusActive,    bg: Colors.statusActiveBg },
  pending_approval: { label: 'Pending',     fg: Colors.statusPending,   bg: Colors.statusPendingBg },
  approved:         { label: 'Approved',    fg: Colors.statusActive,    bg: Colors.statusActiveBg },
  rejected:         { label: 'Rejected',    fg: Colors.statusRejected,  bg: Colors.statusRejectedBg },
  completed:        { label: 'Completed',   fg: Colors.statusActive,    bg: Colors.statusActiveBg },
  cancelled:        { label: 'Cancelled',   fg: Colors.statusRejected,  bg: Colors.statusRejectedBg },
  draft:            { label: 'Draft',       fg: Colors.statusDraft,     bg: Colors.statusDraftBg },
  processing:       { label: 'Processing',  fg: Colors.statusPending,   bg: Colors.statusPendingBg },
  succeeded:        { label: 'Paid',        fg: Colors.statusActive,    bg: Colors.statusActiveBg },
  failed:           { label: 'Failed',      fg: Colors.statusRejected,  bg: Colors.statusRejectedBg },
};

interface Props {
  status:   Status;
  small?:   boolean;
}

export function StatusPill({ status, small = false }: Props) {
  const cfg = CONFIG[status] ?? CONFIG.draft;
  return (
    <View style={[styles.pill, { backgroundColor: cfg.bg }, small && styles.small]}>
      <View style={[styles.dot, { backgroundColor: cfg.fg }]} />
      <Text style={[styles.label, { color: cfg.fg }, small && styles.smallText]}>
        {cfg.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection:  'row',
    alignItems:     'center',
    alignSelf:      'flex-start',
    borderRadius:   Radius.pill,
    paddingVertical:   Spacing.xxs + 1,
    paddingHorizontal: Spacing.sm,
    gap: 4,
  },
  small: {
    paddingVertical:   Spacing.xxs,
    paddingHorizontal: Spacing.xs + 2,
  },
  dot: {
    width:        6,
    height:       6,
    borderRadius: 3,
  },
  label: {
    fontFamily: FontFamily.interSemiBold,
    fontSize:   FontSize.xs + 1,
  },
  smallText: {
    fontSize: FontSize.xs,
  },
});
