import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '../../constants';

interface Props {
  label:     string;
  active?:   boolean;
  onPress:   () => void;
}

export function FilterChip({ label, active = false, onPress }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.chip, active && styles.activeChip]}
    >
      <Text style={[styles.label, active && styles.activeLabel]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius:    Radius.pill,
    borderWidth:     1.5,
    borderColor:     Colors.border,
    paddingVertical: Spacing.xs + 1,
    paddingHorizontal: Spacing.md,
    marginRight:     Spacing.sm,
    backgroundColor: Colors.white,
  },
  activeChip: {
    backgroundColor: Colors.greenLight,
    borderColor:     Colors.green,
  },
  label: {
    fontFamily: FontFamily.interMedium,
    fontSize:   FontSize.sm,
    color:      Colors.mid,
  },
  activeLabel: {
    color: Colors.green,
  },
});
