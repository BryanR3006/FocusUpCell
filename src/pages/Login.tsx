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
      console.log('Enviando datos:', formData);
      await login(formData);
      navigation.navigate("Home" as never);
    } catch (err: any) {
      console.error('Error completo:', err);
      const errorMessage = err?.message || "Error al iniciar sesión. Verifica tus credenciales.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {

    console.log("Navegar a registro");
  };

  const handleForgotPassword = () => {
   
    console.log("Navegar a recuperar contraseña");
  };

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Image
            source={require("../../assets/img/Logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>Iniciar sesión</Text>

          {error !== "" && (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle" size={16} color="#fff" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Email */}
          <View style={styles.inputGroup}>
            <Icon name="mail" color="#888" size={20} style={styles.icon} />
            <TextInput
              placeholder="Correo electrónico"
              placeholderTextColor="#aaa"
              style={styles.input}
              value={formData.correo}
              onChangeText={(text) => setFormData({ ...formData, correo: text })}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Icon name="lock" color="#888" size={20} style={styles.icon} />
            <TextInput
              placeholder="Contraseña"
              placeholderTextColor="#aaa"
              style={styles.input}
              secureTextEntry={!showPassword}
              value={formData.contrasena}
              onChangeText={(text) => setFormData({ ...formData, contrasena: text })}
              autoCapitalize="none"
              autoComplete="password"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              {showPassword ? (
                <Icon name="eye-off" color="#888" size={20} />
              ) : (
                <Icon name="eye" color="#888" size={20} />
              )}
            </TouchableOpacity>
          </View>

          {/* Submit */}
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

          {/* Links */}
          <View style={styles.links}>
            <TouchableOpacity onPress={handleRegister}>
              <Text style={styles.link}>Registrarse</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#171717",
  },
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
    width: 200,
    height: 80,
    alignSelf: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    color: "#fff",
    textAlign: "center",
    marginBottom: 16,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ff4d4f",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: "#fff",
    fontSize: 14,
    flex: 1,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    position: "relative",
  },
  icon: {
    marginRight: 8,
  },
  eyeIcon: {
    position: "absolute",
    right: 12,
  },
  input: {
    flex: 1,
    color: "#fff",
    paddingVertical: 12,
  },
  button: {
    backgroundColor: "#007bff",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  links: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  link: {
    color: "#4da6ff",
    fontSize: 14,
  },
});

export default Login;