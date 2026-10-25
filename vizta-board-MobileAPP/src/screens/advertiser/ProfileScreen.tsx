import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Radius, Shadow, Spacing } from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import { GreenHeader } from '../../components/common/GreenHeader';
import { PrimaryButton } from '../../components/common/PrimaryButton';

const MENU_GROUPS = [
  {
    title: 'Account',
    items: [
      { icon: '👤', label: 'Edit Profile',        onPress: () => {} },
      { icon: '🔒', label: 'Security & MFA',      onPress: () => {} },
      { icon: '📧', label: 'Email Preferences',   onPress: () => {} },
    ],
  },
  {
    title: 'Billing',
    items: [
      { icon: '💳', label: 'Payment Methods',     onPress: () => {} },
      { icon: '🧾', label: 'Payment History',     onPress: () => {} },
      { icon: '📄', label: 'Invoices',            onPress: () => {} },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: '❓', label: 'Help & FAQ',          onPress: () => {} },
      { icon: '💬', label: 'Contact Support',     onPress: () => {} },
      { icon: '⭐', label: 'Rate the App',        onPress: () => {} },
    ],
  },
];

export default function ProfileScreen() {
  const insets     = useSafeAreaInsets();
  const { user, signOut, isLoading } = useAuth();

  const initials = user
    ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()
    : '?';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <GreenHeader title="Profile" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* ── Avatar card ── */}
        <View style={styles.avatarCard}>
          <View style={styles.avatar}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
          <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.rolePill}>
            <Text style={styles.roleText}>{(user?.role ?? '').replace(/_/g,' ')}</Text>
          </View>
        </View>

        {/* ── Menu groups ── */}
        {MENU_GROUPS.map((group) => (
          <View key={group.title} style={styles.group}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <View style={styles.groupCard}>
              {group.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.menuItem, idx < group.items.length - 1 && styles.menuItemBorder]}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuChevron}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* ── Sign out ── */}
        <View style={styles.signOutSection}>
          <PrimaryButton
            label="Sign Out"
            onPress={signOut}
            isLoading={isLoading}
            style={styles.signOutBtn}
          />
          <Text style={styles.versionText}>Vizta Board v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: Colors.offWhite },
  scroll:{ padding: Spacing.base, paddingBottom: Spacing['4xl'] },

  avatarCard: {
    backgroundColor: Colors.white,
    borderRadius:    Radius.xl,
    padding:         Spacing.xl,
    alignItems:      'center',
    marginBottom:    Spacing.xl,
    ...Shadow.card,
  },
  avatar: {
    width:           80,
    height:          80,
    borderRadius:    40,
    backgroundColor: Colors.green,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    Spacing.md,
  },
  initials: {
    fontFamily: FontFamily.nunitoExtraBold,
    fontSize:   FontSize.xl,
    color:      Colors.white,
  },
  name: {
    fontFamily: FontFamily.nunitoExtraBold,
    fontSize:   FontSize.xl,
    color:      Colors.dark,
  },
  email: {
    fontFamily:   FontFamily.inter,
    fontSize:     FontSize.base,
    color:        Colors.muted,
    marginBottom: Spacing.md,
  },
  rolePill: {
    backgroundColor: Colors.greenLight,
    borderRadius:    Radius.pill,
    paddingVertical: 4,
    paddingHorizontal: Spacing.md,
  },
  roleText: {
    fontFamily: FontFamily.interSemiBold,
    fontSize:   FontSize.sm,
    color:      Colors.green,
    textTransform:'capitalize',
  },

  group:      { marginBottom: Spacing.base },
  groupTitle: {
    fontFamily:   FontFamily.interSemiBold,
    fontSize:     FontSize.sm,
    color:        Colors.muted,
    textTransform:'uppercase',
    letterSpacing: 0.5,
    marginBottom:  Spacing.sm,
    marginLeft:    Spacing.xs,
  },
  groupCard: {
    backgroundColor: Colors.white,
    borderRadius:    Radius.lg,
    overflow:        'hidden',
    ...Shadow.card,
  },
  menuItem: {
    flexDirection:    'row',
    alignItems:       'center',
    paddingVertical:  Spacing.base,
    paddingHorizontal:Spacing.base,
    gap: Spacing.md,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuIcon:    { fontSize: 20, width: 24, textAlign: 'center' },
  menuLabel:   { flex: 1, fontFamily: FontFamily.inter, fontSize: FontSize.base, color: Colors.dark },
  menuChevron: { fontFamily: FontFamily.inter, fontSize: 22, color: Colors.muted },

  signOutSection: {
    alignItems:  'center',
    gap:         Spacing.md,
    marginTop:   Spacing.sm,
  },
  signOutBtn:  {
    backgroundColor: Colors.errorBg,
    borderWidth:     1,
    borderColor:     Colors.error,
  },
  versionText: { fontFamily: FontFamily.inter, fontSize: FontSize.xs, color: Colors.muted },
});
