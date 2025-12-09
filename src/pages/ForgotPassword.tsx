import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Feather";
import { Mail, ChevronLeft} from "lucide-react-native";

import { apiClient } from "../clientes/apiClient";
import { API_ENDPOINTS } from "../utils/constants";
import type { RootStackParamList } from "../types/navigation";

const ForgotPasswordPage = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      await apiClient.post(API_ENDPOINTS.REQUEST_PASSWORD_RESET, {
        emailOrUsername: email,
      });

      // Guardar email para siguiente pantalla
      await AsyncStorage.setItem("resetEmail", email);

      // Navegar a la pantalla donde ingresan el código
      navigation.navigate("ForgotPasswordCode");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Error al enviar el código";

      setError(msg);
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Botón atrás */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <ChevronLeft size={28} color="#fff" />
      </TouchableOpacity>

      <View style={styles.card}>
        <Image
          source={require("../../assets/img/Logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.instructions}>
          Ingresa el correo electrónico asociado a tu cuenta
        </Text>

        <View style={styles.inputContainer}>
          <Mail size={20} color="#9ca3af" style={styles.inputIcon} />
          <TextInput
            placeholder="Correo electrónico"
            placeholderTextColor="#9ca3af"
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            editable={!loading}
          />
        </View>

        {error !== "" && <Text style={styles.errorText}>{error}</Text>}

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

export default ForgotPasswordPage;

// ⚡ ESTILOS
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
    padding: 5,
    zIndex: 10,
  },
  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 20,
    paddingBottom: 30,
  },
  logo: {
    width: 220,
    height: 110,
    alignSelf: "center",
    marginBottom: 25,
  },
  instructions: {
    color: "#d1d5db",
    textAlign: "center",
    marginBottom: 25,
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#232323",
    borderColor: "#2f2f2f",
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 12,
    minHeight: 50,
  },
  inputIcon: {
    marginRight: 10,
  },

  input: {
    color: "white",
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 0, 
    paddingRight: 10,
    fontSize: 15,
  },
  errorText: {
    color: "#ef4444",
    textAlign: "center",
    marginBottom: 12,
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
