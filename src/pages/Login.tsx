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
  const [formData, setFormData] = useState<LoginRequest>({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      await login(formData);
      navigation.navigate("home" as never);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.error || err?.message || "Error al iniciar sesión";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Image
            source={require("../../assets/img/Logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>Iniciar sesión</Text>

          {error !== "" && <Text style={styles.error}>{error}</Text>}

          {/* Email */}
          <View style={styles.inputGroup}>
            <Icon name="mail" color="#888" size={20} style={styles.icon} />
            <TextInput
              placeholder="Correo electrónico"
              placeholderTextColor="#aaa"
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              autoCapitalize="none"
              keyboardType="email-address"
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
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              {showPassword ? <Icon name="eye-off" color="#888" size={20} /> : <Icon name="eye" color="#888" size={20} />}
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
            <TouchableOpacity>
              <Text style={styles.link}>Registrarse</Text>
            </TouchableOpacity>
            <TouchableOpacity>
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
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
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
  error: {
    backgroundColor: "#ff4d4f",
    color: "#fff",
    padding: 10,
    borderRadius: 8,
    textAlign: "center",
    marginBottom: 16,
    fontSize: 14,
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
