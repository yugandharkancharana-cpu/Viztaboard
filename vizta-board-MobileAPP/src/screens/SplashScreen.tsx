/**
 * SplashScreen
 * Shown on launch while fonts load and auth state resolves.
 * Green background with the Vizta Board wordmark.
 */

import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '@clerk/clerk-expo';
import { Colors, FontFamily, FontSize } from '../constants';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    const timeout = setTimeout(() => {
      navigation.replace(isSignedIn ? 'Advertiser' : 'Auth');
    }, 1_200);
    return () => clearTimeout(timeout);
  }, [isLoaded, isSignedIn, navigation]);

  return (
    <View style={styles.container}>
      {/* Wordmark */}
      <Text style={styles.brand}>Vizta</Text>
      <Text style={styles.brandSub}>Board</Text>
      <Text style={styles.tagline}>Africa's Billboard Marketplace</Text>

      {/* Spinner */}
      <View style={styles.spinnerWrap}>
        <ActivityIndicator color={Colors.white} size="large" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: Colors.green,
    alignItems:      'center',
    justifyContent:  'center',
  },
  brand: {
    fontFamily: FontFamily.nunitoBlack,
    fontSize:   FontSize['4xl'],
    color:      Colors.white,
    letterSpacing: 2,
  },
  brandSub: {
    fontFamily: FontFamily.nunitoExtraBold,
    fontSize:   FontSize['2xl'],
    color:      'rgba(255,255,255,0.75)',
    letterSpacing: 4,
    marginTop:  -8,
  },
  tagline: {
    fontFamily: FontFamily.inter,
    fontSize:   FontSize.sm,
    color:      'rgba(255,255,255,0.6)',
    marginTop:  Spacing.base,
    letterSpacing: 0.5,
  },
  spinnerWrap: {
    position:  'absolute',
    bottom:    80,
  },
});

// Spacing imported inline to avoid circular dep warning at parse time
const Spacing = { base: 16 };
