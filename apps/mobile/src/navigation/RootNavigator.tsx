import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { colors } from "@dromaios/ui";
import type { LearnStackParamList, RootTabParamList } from "./types.js";
import { HomeScreen } from "../screens/HomeScreen.js";
import { LessonPlayerScreen } from "../screens/LessonPlayerScreen.js";
import { QuickReferenceScreen } from "../screens/QuickReferenceScreen.js";
import { MyRecordScreen } from "../screens/MyRecordScreen.js";
import { AboutScreen } from "../screens/AboutScreen.js";

const Stack = createNativeStackNavigator<LearnStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

const screenHeader = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.text,
  headerTitleStyle: { color: colors.text }
} as const;

function LearnStack() {
  return (
    <Stack.Navigator screenOptions={screenHeader}>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: "Safer Practice" }} />
      <Stack.Screen
        name="LessonPlayer"
        component={LessonPlayerScreen}
        options={{ title: "Lesson" }}
      />
    </Stack.Navigator>
  );
}

export function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        ...screenHeader,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted
      }}
    >
      <Tab.Screen name="Learn" component={LearnStack} options={{ headerShown: false }} />
      <Tab.Screen
        name="Reference"
        component={QuickReferenceScreen}
        options={{ title: "Quick reference" }}
      />
      <Tab.Screen name="Record" component={MyRecordScreen} options={{ title: "My record" }} />
      <Tab.Screen name="About" component={AboutScreen} options={{ title: "About" }} />
    </Tab.Navigator>
  );
}
