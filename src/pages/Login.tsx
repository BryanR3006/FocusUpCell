import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";

import Icon from "react-native-vector-icons/Feather";
import { AuthContext } from "../contexts/AuthContext";
import type { LoginRequest } from "../types/user";
import { useNavigation } from "@react-navigation/native";

const Login: React.FC = () => {
  const { login } = useContext(AuthContext);
  const navigation = useNavigation();

  const [formData, setFormData] = useState<LoginRequest>({
    correo: "",
    contrasena: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!formData.correo || !formData.contrasena) {
      setError("Por favor, completa todos los campos");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.correo)) {
      setError("Por favor, ingresa un email válido");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await login(formData);
      navigation.navigate("Home" as never);
    } catch (err: any) {
      const errorMessage =
        err?.message || "Error al iniciar sesión. Verifica tus credenciales.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    navigation.navigate("Register" as never);
  };

  const handleForgotPassword = () => {
    navigation.navigate("ForgotPassword" as never);
  };

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          
          {/* LOGO */}
          <Image
            source={require("../../assets/img/Logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          {/* ERROR */}
          {error !== "" && (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle" size={16} color="#fff" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* EMAIL */}
          <View style={styles.inputGroup}>
            <Icon name="mail" size={20} style={styles.icon} />
            <TextInput
              placeholder="Correo electrónico"
              placeholderTextColor="#aaa"
              style={styles.input}
              value={formData.correo}
              onChangeText={(text) =>
                setFormData({ ...formData, correo: text })
              }
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          {/* CONTRASEÑA */}
          <View style={styles.inputGroup}>
            <Icon name="lock" size={20} style={styles.icon} />
            <TextInput
              placeholder="Contraseña"
              placeholderTextColor="#aaa"
              style={styles.input}
              secureTextEntry={!showPassword}
              value={formData.contrasena}
              onChangeText={(text) =>
                setFormData({ ...formData, contrasena: text })
              }
              autoCapitalize="none"
              autoComplete="password"
            />

            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              {showPassword ? (
                <Icon name="eye-off" size={20} color="#888" />
              ) : (
                <Icon name="eye" size={20} color="#888" />
              )}
            </TouchableOpacity>
          </View>

          {/* BOTÓN LOGIN */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Iniciar sesión</Text>
            )}
          </TouchableOpacity>

          {/* GOOGLE */}
          <TouchableOpacity
            style={[styles.button2, loading && styles.buttonDisabled]}
            onPress={() => console.log("Google")}
            disabled={loading}
          >
            <View style={styles.googleRow}>
              <Image
                source={require("../../assets/img/google.png")}
                style={styles.googleIcon}
              />
              <Text style={styles.buttonText2}>Iniciar con Google</Text>
            </View>
          </TouchableOpacity>

          {/* LINKS */}
          <View style={styles.links}>
            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.links}>
            <TouchableOpacity onPress={handleRegister}>
              <Text style={styles.link2}>Registrarse</Text>
            </TouchableOpacity>
          </View>
          
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};



const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#171717" },

  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },

  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 24,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#333",
  },

  logo: {
    width: 260,
    height: 120,
    alignSelf: "center",
    marginBottom: 20,
  },

  /* ERROR */
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF4D4F",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },

  errorText: {
    color: "#fff",
    fontSize: 14,
    flex: 1,
  },

  /* INPUTS */
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4EFFA",
    borderRadius: 10,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#DDD",
  },

  icon: {
    marginRight: 8,
    color: "#666",
  },

  input: {
    flex: 1,
    color: "#171717",
    paddingVertical: 12,
    fontSize: 15,
  },

  eyeIcon: {
    position: "absolute",
    right: 12,
  },

  /* BOTÓN LOGIN */
  button: {
    backgroundColor: "#3B82F6",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },

  buttonDisabled: { opacity: 0.6 },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  /* BOTÓN GOOGLE */
  button2: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#DDD",
  },

  googleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  googleIcon: {
    width: 22,
    height: 22,
  },

  buttonText2: {
    color: "#171717",
    fontWeight: "bold",
    fontSize: 16,
  },

  /* LINKS */
  links: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },

  link: {
    color: "#3B82F6",
    fontSize: 15,
  },

  link2: {
    marginTop: 30,
    color: "#F4EFFA",
    fontSize: 16,
    padding: 6,
    width: 300,
    textAlign: "center",
    borderWidth: 2,
    borderColor: "#3B82F6",
    borderRadius: 10,
  },
});

export default Login;
