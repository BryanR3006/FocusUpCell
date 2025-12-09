import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthProvider } from "./src/contexts/AuthContext";
import { AudioProvider } from "./src/contexts/AudioContext";
import { CompactMusicPlayer } from "./src/ui/CompactMusicPlayer";
import type { RootStackParamList } from "./src/types/navigation";

import Login from "./src/pages/Login";
import Home from "./src/pages/Home";
import { Register } from "./src/pages/Register";
import { RegisterStep2 } from "./src/pages/RegisterStep2";
import Confirmation from "./src/pages/Confirmation";
import SurveyPage from "./src/pages/Survey";
import StudyMethodsLibraryPage from "./src/pages/StudyMethodsLibraryPage";
import ForgotPassword from "./src/pages/ForgotPassword";
import ForgotPasswordCode from "./src/pages/ForgotPasswordCode";
import ForgotPasswordReset from "./src/pages/ForgotPasswordReset";
import PomodoroIntroScreen from "./src/pages/PomodoroIntroView";
import PomodoroExecutionScreen from "./src/pages/PomodoroExecutionView";
import ProfileScreen from "./src/pages/profilpage";

// Desde Features/Erickson
import { MusicAlbums } from "./src/pages/MusicAlbums";
import { MusicSongs } from "./src/pages/MusicSongs";

// Desde develop: vistas de métodos de estudio y Events
import ActiveRecallIntroView from "./src/pages/ActiveRecallIntroView";
import ActiveRecallStepsView from "./src/pages/ActiveRecallStepsView";
import SpacedRepetitionIntroView from "./src/pages/SpacedRepetitionIntroView";
import SpacedRepetitionStepsView from "./src/pages/SpacedRepetitionStepsView";
import FeynmanIntroView from "./src/pages/FeynmanIntroView";
import FeynmanStepsView from "./src/pages/FeynmanStepsView";
import CornellIntroView from "./src/pages/CornellIntroView";
import CornellStepsView from "./src/pages/CornellStepsView";
import MindMapsIntroView from "./src/pages/MindMapsInfoPage";
import MindMapsStepsView from "./src/pages/MindMapsStepsPage";
import EventsPage from "./src/pages/EventsPage";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <AuthProvider>
      <AudioProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#171717" },
            }}
          >
            {/* Rutas principales */}
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Home" component={Home} />
            <Stack.Screen name="StudyMethods" component={StudyMethodsLibraryPage} />
            <Stack.Screen name="Register" component={Register} />
            <Stack.Screen name="RegisterStep2" component={RegisterStep2} />
            <Stack.Screen name="Confirmation" component={Confirmation} />
            <Stack.Screen name="Survey" component={SurveyPage} />
            <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
            <Stack.Screen name="ForgotPasswordCode" component={ForgotPasswordCode} />
            <Stack.Screen name="ForgotPasswordReset" component={ForgotPasswordReset} />
            <Stack.Screen name="Profile" component={ProfileScreen} />

            {/* Método Pomodoro */}
            <Stack.Screen name="PomodoroIntro" component={PomodoroIntroScreen} />
            <Stack.Screen name="PomodoroExecute" component={PomodoroExecutionScreen} />

            {/* Música */}
            <Stack.Screen name="MusicAlbums" component={MusicAlbums} />
            <Stack.Screen name="MusicSongs" component={MusicSongs} />

            {/* Método Active Recall (Práctica Activa) */}
            <Stack.Screen name="ActiveRecallIntro" component={ActiveRecallIntroView} />
            <Stack.Screen name="ActiveRecallSteps" component={ActiveRecallStepsView} />

            {/* Método Spaced Repetition (Repetición Espaciada) */}
            <Stack.Screen name="SpacedRepetitionIntro" component={SpacedRepetitionIntroView} />
            <Stack.Screen name="SpacedRepetitionSteps" component={SpacedRepetitionStepsView} />

            {/* Método Feynman */}
            <Stack.Screen name="FeynmanIntro" component={FeynmanIntroView} />
            <Stack.Screen name="FeynmanSteps" component={FeynmanStepsView} />

            {/* Método Cornell */}
            <Stack.Screen name="CornellIntro" component={CornellIntroView} />
            <Stack.Screen name="CornellSteps" component={CornellStepsView} />

            {/* Método Mind Maps (Mapas Mentales) */}
            <Stack.Screen name="MindMapsIntro" component={MindMapsIntroView} />
            <Stack.Screen name="MindMapsSteps" component={MindMapsStepsView} />

            {/* Página de Eventos */}
            <Stack.Screen name="Events" component={EventsPage} />
          </Stack.Navigator>
        </NavigationContainer>
        <CompactMusicPlayer />
      </AudioProvider>
    </AuthProvider>
  );
}
