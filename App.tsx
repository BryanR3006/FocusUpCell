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
import StudyMethodsLibraryPage from "./src/pages/StudyMethodsLibraryPage";
import ForgotPassword from "./src/pages/ForgotPassword";
import ForgotPasswordCode from "./src/pages/ForgotPasswordCode";
import ForgotPasswordReset from "./src/pages/ForgotPasswordReset";
import PomodoroIntroScreen from "./src/pages/PomodoroIntroView";
import PomodoroExecutionScreen from "./src/pages/PomodoroExecutionView";
import ProfileScreen from "./src/pages/profilpage"; 

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Login"
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#171717" },
          }}
        >
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="StudyMethods" component={StudyMethodsLibraryPage} />
          <Stack.Screen name="Register" component={Register} />
          <Stack.Screen name="Confirmation" component={Confirmation} />
          <Stack.Screen name="Survey" component={SurveyPage} />
          <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
          <Stack.Screen name="ForgotPasswordCode" component={ForgotPasswordCode} />
          <Stack.Screen name="ForgotPasswordReset" component={ForgotPasswordReset} />
          <Stack.Screen name="PomodoroIntro" component={PomodoroIntroScreen} />
          <Stack.Screen name="PomodoroExecute" component={PomodoroExecutionScreen} />
          
          {/* Nueva ruta para Perfil */}
          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen}
            options={{
              title: "Perfil",
              headerShown: false,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}