import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RecordProvider } from "./src/lib/record.js";
import { RootNavigator } from "./src/navigation/RootNavigator.js";

export default function App() {
  return (
    <SafeAreaProvider>
      <RecordProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <RootNavigator />
        </NavigationContainer>
      </RecordProvider>
    </SafeAreaProvider>
  );
}
