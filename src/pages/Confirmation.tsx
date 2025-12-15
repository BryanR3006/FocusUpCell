import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { RegisterRequest } from "../types/user";
import Icon from "react-native-vector-icons/Feather";
import {ChevronLeft } from "lucide-react-native";

const ConfirmationPage = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleYes = () => {
    navigation.navigate("Survey");
  };

  const handleNo = async () => {
    setLoading(true);
    setError("");

    try {
      const storedData = await AsyncStorage.getItem("registrationData");

      if (!storedData) {
        setError("No se encontraron datos guardados.");
        return;
      }

      const formData: RegisterRequest = JSON.parse(storedData);

      let fechaNacimiento: string | null = null;

      if (formData.fecha_nacimiento) {
        if (typeof formData.fecha_nacimiento === "string") {
          fechaNacimiento = formData.fecha_nacimiento;
        } else {
          const f = new Date(formData.fecha_nacimiento as any);
          if (!Number.isNaN(f.getTime())) {
            fechaNacimiento = f.toISOString().split("T")[0];
          }
        }
      }

      const payload = {
        nombre_usuario: formData.nombre_usuario,
        correo: formData.correo,
        contrasena: formData.contrasena,
        fecha_nacimiento: fechaNacimiento,
        pais: formData.pais || "",
        genero: formData.genero || "",
      };

      const { apiClient } = await import("../clientes/apiClient");
      const { API_ENDPOINTS } = await import("../utils/constants");

      await apiClient.post(API_ENDPOINTS.REGISTER, payload);

      Alert.alert("Registro exitoso", "Serás redirigido al inicio de sesión", [
        {
          text: "Aceptar",
          onPress: () => navigation.navigate("Login"),
        },
      ]);
    } catch (e: any) {
      setError(
        e?.response?.data?.error ||
          e?.message ||
          "Error al registrar usuario."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#171717", "#1a1a1a"]} style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Botón atrás */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft size={28} color="#fff" />
        </TouchableOpacity>

        <View style={styles.card}>
          
          {/* LOGO */}
          <Image
            source={require("../../assets/img/Logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>
            Para ofrecerte una mejor experiencia, nos gustaría conocerte un poco
            más. Te invitamos a responder una breve encuesta.
          </Text>

          {/* ERROR */}
          {error !== "" && (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle" size={16} color="#fff" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* BOTÓN CONTINUAR */}
          <TouchableOpacity style={styles.primaryButton} onPress={handleYes}>
            <Text style={styles.primaryText}>Continuar</Text>
          </TouchableOpacity>

          {/* BOTÓN NO, GRACIAS */}
          <TouchableOpacity
            style={[styles.secondaryButton, loading && { opacity: 0.6 }]}
            onPress={handleNo}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.secondaryText}>No, gracias</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

export default ConfirmationPage;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  card: {
    backgroundColor: "#222",
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  logo: {
    width: 190,
    height: 60,
    alignSelf: "center",
    marginBottom: 18,
  },
  title: {
    color: "#fff",
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ef4444",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    gap: 6,
  },
  errorText: {
    color: "#fff",
    fontSize: 13,
    flex: 1,
  },
  primaryButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  primaryText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: "#ef4444",
    paddingVertical: 12,
    borderRadius: 10,
  },
  secondaryText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 15,
  },
});
