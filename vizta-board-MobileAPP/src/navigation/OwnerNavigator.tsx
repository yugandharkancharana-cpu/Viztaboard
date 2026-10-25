import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { OwnerTabParamList } from '../types';
import { Colors, FontFamily, Spacing } from '../constants';

import OwnerDashboardScreen  from '../screens/owner/OwnerDashboardScreen';
import NotificationsScreen   from '../screens/advertiser/NotificationsScreen';  // shared
import ProfileScreen         from '../screens/advertiser/ProfileScreen';         // shared

const Tab = createBottomTabNavigator<OwnerTabParamList>();

function TabIcon({ icon, label, focused }: { icon:string; label:string; focused:boolean }) {
  return (
    <View style={s.wrap}>
      <Text style={s.icon}>{icon}</Text>
      <Text style={[s.label, focused && s.active]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:  { alignItems: 'center', paddingTop: Spacing.xs },
  icon:  { fontSize: 22 },
  label: { fontFamily: FontFamily.inter, fontSize: 10, color: Colors.muted, marginTop: 2 },
  active:{ color: Colors.green, fontFamily: FontFamily.interSemiBold },
});

export default function OwnerNavigator() {
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
        name="Dashboard"
        component={OwnerDashboardScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🏢" label="Dashboard"     focused={focused} /> }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🔔" label="Alerts"        focused={focused} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="👤" label="Profile"       focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}
