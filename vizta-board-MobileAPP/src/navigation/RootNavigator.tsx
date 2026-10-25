/**
 * RootNavigator
 * Top-level navigation tree:
 *   Splash → Auth (unauthenticated) | Advertiser | Owner (authenticated)
 *
 * Routing is driven by Clerk auth state + the user's platform role.
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth as useClerkAuth } from '@clerk/clerk-expo';
import { useAuth } from '../hooks/useAuth';
import type { RootStackParamList } from '../types';

import SplashScreen         from '../screens/SplashScreen';
import AuthNavigator        from './AuthNavigator';
import AdvertiserNavigator  from './AdvertiserNavigator';
import OwnerNavigator       from './OwnerNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { isLoaded, isSignedIn } = useClerkAuth();
  const { user }                 = useAuth();

  // Determine which main navigator to show once auth is loaded
  const getMainScreen = (): keyof RootStackParamList => {
    if (!isSignedIn || !user) return 'Auth';
    if (user.role === 'billboard_owner') return 'Owner';
    return 'Advertiser';   // advertiser + sales_exec + finance + ops all use advertiser nav
  };

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isLoaded ? (
          <Stack.Screen name="Splash" component={SplashScreen} />
        ) : (
          <>
            <Stack.Screen name={getMainScreen()} component={
              !isSignedIn ? AuthNavigator :
              user?.role === 'billboard_owner' ? OwnerNavigator : AdvertiserNavigator
            } />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
