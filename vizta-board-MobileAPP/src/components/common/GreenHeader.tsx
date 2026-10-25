import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Spacing } from '../../constants';

interface Props {
  title:          string;
  subtitle?:      string;
  showBack?:      boolean;
  onBack?:        () => void;
  rightElement?:  React.ReactNode;
}

export function GreenHeader({
  title,
  subtitle,
  showBack     = false,
  onBack,
  rightElement,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.sm }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.green} />

      <View style={styles.row}>
        {/* Left — back button or spacer */}
        <View style={styles.side}>
          {showBack && (
            <TouchableOpacity onPress={onBack} hitSlop={{ top:10,bottom:10,left:10,right:10 }}>
              {/* ← chevron rendered as text for zero-dependency simplicity */}
              <Text style={styles.backIcon}>‹</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Centre — title + subtitle */}
        <View style={styles.centre}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
          ) : null}
        </View>

        {/* Right — custom element or spacer */}
        <View style={styles.side}>{rightElement ?? null}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.green,
    paddingBottom:   Spacing.base,
    paddingHorizontal: Spacing.base,
  },
  row: {
    flexDirection:  'row',
    alignItems:     'center',
  },
  side: {
    width: 44,
    alignItems: 'center',
  },
  centre: {
    flex: 1,
    alignItems: 'center',
  },
  backIcon: {
    fontSize:   32,
    color:      Colors.white,
    lineHeight: 36,
    marginTop:  -4,
  },
  title: {
    fontFamily: FontFamily.nunitoBold,
    fontSize:   FontSize.lg,
    color:      Colors.white,
  },
  subtitle: {
    fontFamily: FontFamily.inter,
    fontSize:   FontSize.xs,
    color:      'rgba(255,255,255,0.75)',
    marginTop:  2,
  },
});
