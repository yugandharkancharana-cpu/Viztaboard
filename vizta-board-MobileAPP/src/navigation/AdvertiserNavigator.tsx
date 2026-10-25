/**
 * AdvertiserNavigator
 * Bottom tab bar (Browse / Campaigns / Analytics / Notifications / Profile)
 * with a stack navigator per tab for drill-down screens.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AdvertiserTabParamList, AdvertiserStackParamList } from '../types';
import { Colors, FontFamily, FontSize, Spacing } from '../constants';

import BrowseScreen          from '../screens/advertiser/BrowseScreen';
import BillboardDetailScreen from '../screens/advertiser/BillboardDetailScreen';
import BookingScreen         from '../screens/advertiser/BookingScreen';
import PaymentScreen         from '../screens/advertiser/PaymentScreen';
import CampaignsScreen       from '../screens/advertiser/CampaignsScreen';
import AnalyticsScreen       from '../screens/advertiser/AnalyticsScreen';
import NotificationsScreen   from '../screens/advertiser/NotificationsScreen';
import ProfileScreen         from '../screens/advertiser/ProfileScreen';

const Tab   = createBottomTabNavigator<AdvertiserTabParamList>();
const Stack = createNativeStackNavigator<AdvertiserStackParamList>();

// Wrap Browse tab in its own stack for drill-down
function BrowseStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BrowseTab"       component={BrowseScreen} />
      <Stack.Screen name="BillboardDetail" component={BillboardDetailScreen} />
      <Stack.Screen name="Booking"         component={BookingScreen} />
      <Stack.Screen name="Payment"         component={PaymentScreen} />
    </Stack.Navigator>
  );
}

type TabIconProps = { icon: string; label: string; focused: boolean };
function TabIcon({ icon, label, focused }: TabIconProps) {
  return (
    <View style={tabStyles.wrap}>
      <Text style={tabStyles.icon}>{icon}</Text>
      <Text style={[tabStyles.label, focused && tabStyles.labelActive]}>{label}</Text>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  wrap:        { alignItems: 'center', paddingTop: Spacing.xs },
  icon:        { fontSize: 22 },
  label:       { fontFamily: FontFamily.inter, fontSize: 10, color: Colors.muted, marginTop: 2 },
  labelActive: { color: Colors.green, fontFamily: FontFamily.interSemiBold },
});

export default function AdvertiserNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown:     false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height:          60,
          borderTopColor:  Colors.border,
          backgroundColor: Colors.white,
        },
      }}
    >
      <Tab.Screen
        name="Browse"
        component={BrowseStack}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🗺️" label="Browse"    focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Campaigns"
        component={CampaignsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="📊" label="Campaigns"  focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🔔" label="Alerts"    focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="👤" label="Profile"   focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}
