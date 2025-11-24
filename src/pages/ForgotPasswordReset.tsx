import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {ChevronLeft, Eye , EyeOff} from "lucide-react-native";

import { apiClient } from "../clientes/apiClient";
import { API_ENDPOINTS } from "../utils/constants";

import type { RootStackParamList } from "../types/navigation";

const ForgotPasswordResetPage = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Validación de contraseña
  const validatePassword = (password: string): boolean => {
    const minLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);

    return minLength && hasUppercase && hasNumber;
  };

  const handleSubmit = async () => {
  setError("");

  if (newPassword !== confirmPassword) {
    setError("Las contraseñas no coinciden");
    return;
  }

  if (!validatePassword(newPassword)) {
    setError(
      "La contraseña debe tener al menos 8 caracteres, una mayúscula y un número"
    );
    return;
  }

  setLoading(true);

  try {
    const email = await AsyncStorage.getItem("resetEmail");
    const code = await AsyncStorage.getItem("resetCode");

    if (!email || !code) {
      Alert.alert(
        "Error",
        "Información incompleta. Por favor inicia el proceso nuevamente.",
        [
          {
            text: "Aceptar",
            onPress: () => navigation.replace("ForgotPassword"),
          },
        ]
      );
      return;
    }

    await apiClient.post(API_ENDPOINTS.RESET_PASSWORD_WITH_CODE, {
      email,
      code,
      newPassword,
    });

    await AsyncStorage.removeItem("resetEmail");
    await AsyncStorage.removeItem("resetCode");

    // EL TRUCO QUE LO ARREGLA EN ANDROID
    setTimeout(() => {
      Alert.alert(
        "Contraseña restablecida",
        "Tu contraseña fue actualizada exitosamente.",
        [
          {
            text: "Aceptar",
            onPress: () => navigation.replace("Login"), // <-- FUNCIONA SIEMPRE
          },
        ]
      );
    }, 300);

  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err.message ||
      "Error al restablecer la contraseña";

    setError(msg);
    Alert.alert("Error", msg);
  } finally {
    setLoading(false);
  }
};


  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <ChevronLeft size={28} color="#fff" />
      </TouchableOpacity>

      <View style={styles.card}>
        <Image
          source={require("../../assets/img/Logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.instructions}>Escribe una nueva contraseña</Text>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Contraseña nueva"
            placeholderTextColor="#9ca3af"
            secureTextEntry={!showNewPassword}
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowNewPassword(!showNewPassword)}
          >
            {showNewPassword ? (
              <EyeOff size={22} color="#666" /> 
            ) : (
              <Eye size={22} color="#666" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Confirmar contraseña"
            placeholderTextColor="#9ca3af"
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeOff size={22} color="#666" /> 
            ) : (
              <Eye size={22} color="#666" />
            )}
          </TouchableOpacity>
        </View>

        {error !== "" && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Continuar</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default ForgotPasswordResetPage;

// 🎨 Estilos
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#171717",
    justifyContent: "center",
    padding: 20,
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
  },
  card: {
    backgroundColor: "#1a1a1a",
    padding: 25,
    borderRadius: 15,
  },
  logo: {
    width: 220,
    height: 110,
    alignSelf: "center",
    marginBottom: 30,
  },
  instructions: {
    color: "#d1d5db",
    textAlign: "center",
    fontSize: 16,
    marginBottom: 25,
  },
  inputWrapper: {
    position: "relative",
    marginBottom: 18,
  },
  input: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 15,
    paddingRight: 45,
    borderRadius: 10,
    fontSize: 16,
    color: "#000",
  },
  eyeButton: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: [{ translateY: -12 }],
  },
  error: {
    backgroundColor: "#ef4444",
    color: "#fff",
    padding: 10,
    borderRadius: 8,
    textAlign: "center",
    marginBottom: 10,
  },
  submitBtn: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 10,
  },
  submitText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
  },
});
