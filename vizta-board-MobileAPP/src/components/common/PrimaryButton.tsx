import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '../../constants';

interface Props {
  label:       string;
  onPress:     () => void;
  isLoading?:  boolean;
  disabled?:   boolean;
  size?:       'sm' | 'md' | 'lg';
  fullWidth?:  boolean;
  style?:      ViewStyle;
  textStyle?:  TextStyle;
}

export function PrimaryButton({
  label,
  onPress,
  isLoading  = false,
  disabled   = false,
  size       = 'md',
  fullWidth  = true,
  style,
  textStyle,
}: Props) {
  const sizeStyles = sizeMap[size];
  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.base,
        sizeStyles.btn,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color={Colors.white} size="small" />
      ) : (
        <Text style={[styles.label, sizeStyles.text, textStyle]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.green,
    borderRadius:    Radius.pill,
    alignItems:      'center',
    justifyContent:  'center',
  },
  fullWidth: { width: '100%' },
  disabled:  { opacity: 0.5 },
  label: {
    fontFamily: FontFamily.interSemiBold,
    color:      Colors.white,
  },
});

const sizeMap = {
  sm: {
    btn:  { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.base },
    text: { fontSize: FontSize.sm } as TextStyle,
  },
  md: {
    btn:  { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl },
    text: { fontSize: FontSize.base } as TextStyle,
  },
  lg: {
    btn:  { paddingVertical: Spacing.base + 2, paddingHorizontal: Spacing['2xl'] },
    text: { fontSize: FontSize.md } as TextStyle,
  },
};
