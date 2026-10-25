/**
 * Vizta Board — React Native (Expo) root
 *
 * Bootstrap order:
 *  1. Load Google Fonts (Nunito + Inter)
 *  2. Wrap with Stripe provider
 *  3. Wrap with Clerk provider (Expo token cache using SecureStore)
 *  4. Render navigation tree
 */

import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { StripeProvider } from '@stripe/stripe-react-native';
import { ClerkProvider, TokenCache } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

import {
  useFonts,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from '@expo-google-fonts/nunito';

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

import RootNavigator from './src/navigation/RootNavigator';

// Keep the splash screen visible while loading fonts
SplashScreen.preventAutoHideAsync();

// ── Clerk SecureStore token cache ─────────────────────────────────────────────

const tokenCache: TokenCache = {
  async getToken(key: string) {
    try { return await SecureStore.getItemAsync(key); }
    catch { return null; }
  },
  async saveToken(key: string, value: string) {
    try { await SecureStore.setItemAsync(key, value); }
    catch { /* swallow */ }
  },
};

// ── Config from app.json extra ────────────────────────────────────────────────

const CLERK_KEY     = Constants.expoConfig?.extra?.clerkPublishableKey ?? '';
const STRIPE_KEY    = 'pk_test_REPLACE_WITH_YOUR_STRIPE_PUBLISHABLE_KEY';
const MERCHANT_ID   = 'merchant.com.skaah.viztaboard';

// ── Root component ────────────────────────────────────────────────────────────

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  React.useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;  // Keep native splash visible
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ClerkProvider
          publishableKey={CLERK_KEY}
          tokenCache={tokenCache}
        >
          <StripeProvider
            publishableKey={STRIPE_KEY}
            merchantIdentifier={MERCHANT_ID}
            urlScheme="viztaboard"
          >
            <StatusBar style="auto" />
            <RootNavigator />
          </StripeProvider>
        </ClerkProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
