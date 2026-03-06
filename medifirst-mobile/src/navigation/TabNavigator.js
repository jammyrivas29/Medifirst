import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';

// ── Screens ──
import GuestHomeScreen from '../screens/home/GuestHomeScreen';
import UserHomeScreen from '../screens/home/UserHomeScreen';
import GuidesListScreen from '../screens/firstAid/GuidesListScreen';
import GuideDetailEnhancedScreen from '../screens/firstAid/GuideDetailEnhancedScreen';
import EmergencyScreen from '../screens/emergency/EmergencyScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import ChatbotScreen from '../screens/chatbot/ChatbotScreen';
import HospitalLocatorScreen from '../screens/hospital/HospitalLocatorScreen';
import VideoInstructionsScreen from '../screens/videos/VideoInstructionsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// ── Guides Stack ──
function GuidesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="GuidesList"
        component={GuidesListScreen}
        options={{
          title: 'First Aid Guides',
          headerStyle: { backgroundColor: '#e74c3c' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen
        name="GuideDetail"
        component={GuideDetailEnhancedScreen}
        options={{
          title: 'Guide Detail',
          headerStyle: { backgroundColor: '#e74c3c' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen
        name="Videos"
        component={VideoInstructionsScreen}
        options={{
          title: 'Video Instructions',
          headerStyle: { backgroundColor: '#e74c3c' },
          headerTintColor: '#fff',
        }}
      />
    </Stack.Navigator>
  );
}

// ── Guest Stack ──
function GuestStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={GuestHomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Guides"
        component={GuidesStack}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Chatbot"
        component={ChatbotScreen}
        options={{
          title: 'AI Assistant',
          headerStyle: { backgroundColor: '#e74c3c' },
          headerTintColor: '#fff',
        }}
      />
      {/* headerShown: false → HospitalLocatorScreen's own green header shows, no duplicate bar */}
      <Stack.Screen
        name="Hospital"
        component={HospitalLocatorScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// ── Main Tab Navigator ──
export default function TabNavigator() {
  const { isAuthenticated, isGuest } = useSelector((state) => state.auth);

  if (isGuest || !isAuthenticated) {
    return <GuestStack />;
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Home:      focused ? 'home'    : 'home-outline',
            Guides:    focused ? 'book'    : 'book-outline',
            Hospital:  focused ? 'medical' : 'medical-outline',
            Emergency: focused ? 'warning' : 'warning-outline',
            Profile:   focused ? 'person'  : 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
        tabBarActiveTintColor:   '#e74c3c',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle:             { paddingBottom: 5, height: 60 },
        headerStyle:             { backgroundColor: '#e74c3c' },
        headerTintColor:         '#fff',
        headerTitleStyle:        { fontWeight: 'bold' },
      })}
    >
      <Tab.Screen
        name="Home"
        component={UserHomeScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Guides"
        component={GuidesStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Hospital"
        component={HospitalLocatorScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Emergency"
        component={EmergencyScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Emergency',
          tabBarBadge: '!',
          tabBarBadgeStyle: { backgroundColor: '#e74c3c', color: '#fff' },
        }}
      />
      {/* Chatbot hidden from tab bar but still navigable via floating button */}
      <Tab.Screen
        name="Chatbot"
        component={ChatbotScreen}
        options={{
          tabBarButton: () => null,
          title: 'AI Assistant',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
}