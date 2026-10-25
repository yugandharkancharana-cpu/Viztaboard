import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, FontFamily, FontSize, Radius, Shadow, Spacing } from '../../constants';

interface Props {
  label:     string;
  value:     string;
  sub?:      string;
  accent?:   string;   // colour for value text
  style?:    ViewStyle;
}

export function KPITile({ label, value, sub, accent = Colors.dark, style }: Props) {
  return (
    <View style={[styles.card, style]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: accent }]}>{value}</Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex:             1,
    backgroundColor:  Colors.white,
    borderRadius:     Radius.md,
    padding:          Spacing.base,
    ...Shadow.card,
  },
  label: {
    fontFamily: FontFamily.interMedium,
    fontSize:   FontSize.xs,
    color:      Colors.muted,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontFamily: FontFamily.nunitoExtraBold,
    fontSize:   FontSize.xl,
  },
  sub: {
    fontFamily: FontFamily.inter,
    fontSize:   FontSize.xs,
    color:      Colors.muted,
    marginTop:  Spacing.xxs,
  },
});
