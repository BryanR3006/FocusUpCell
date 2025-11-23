import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthProvider } from "./src/contexts/AuthContext";
import type { RootStackParamList } from "./src/types/navigation";
import Login from "./src/pages/Login";
import Home from "./src/pages/Home";
import Register from "./src/pages/Register";
import Confirmation from "./src/pages/Confirmation";
import SurveyPage from "./src/pages/Survey";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Login"
          screenOptions={{
            headerShown: false 
          }}
        >
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="Register" component={Register} />
          <Stack.Screen name="Confirmation" component={Confirmation} />
          <Stack.Screen name="Survey" component={SurveyPage} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}