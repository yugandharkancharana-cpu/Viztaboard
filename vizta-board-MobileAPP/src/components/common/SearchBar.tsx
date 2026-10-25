import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '../../constants';

interface Props {
  placeholder?: string;
  value:        string;
  onChangeText: (text: string) => void;
  onSubmit?:    () => void;
}

export function SearchBar({
  placeholder = 'Search billboards, city, area…',
  value,
  onChangeText,
  onSubmit,
}: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, focused && styles.focused]}>
      {/* 🔍 icon as text */}
      <Text style={styles.icon}>🔍</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={Colors.muted}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
          <Text style={styles.clearIcon}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection:    'row',
    alignItems:       'center',
    backgroundColor:  Colors.white,
    borderRadius:     Radius.pill,
    borderWidth:      1.5,
    borderColor:      Colors.border,
    paddingHorizontal: Spacing.base,
    paddingVertical:   Spacing.sm + 2,
    gap: Spacing.sm,
  },
  focused: {
    borderColor: Colors.green,
  },
  icon: {
    fontSize: 15,
  },
  input: {
    flex:       1,
    fontFamily: FontFamily.inter,
    fontSize:   FontSize.base,
    color:      Colors.dark,
    padding:    0,
  },
  clearIcon: {
    fontSize: 13,
    color:    Colors.muted,
  },
});
