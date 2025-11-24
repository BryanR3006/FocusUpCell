import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { User, Mail, Lock, Eye, EyeOff, ChevronLeft } from "lucide-react-native";
import Icon from "react-native-vector-icons/Feather";


type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Register: undefined;
  Confirmation: undefined;
};

const usernameRegex = /^[a-zA-Z0-9_-]+$/;
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList> }) {
  const [formData, setFormData] = useState({
    nombre_usuario: "",
    correo: "",
    password: "",
    fecha_nacimiento: new Date(),
    pais: "",
    genero: "",
  });

  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    // No existe localStorage en React Native, así que usarías AsyncStorage:
    // Aquí lo dejo comentado si más adelante lo implementas.
  }, []);

  const handleChange = (name: 'nombre_usuario' | 'correo' | 'password', value: string) => {
    let newFormData = { ...formData };

    if (name === "nombre_usuario") {
      if (!usernameRegex.test(value) && value !== "") {
        setUsernameError(
          "El nombre de usuario solo puede contener letras, números, guion bajo y guion."
        );
      } else {
        setUsernameError("");
      }
    }

    if (name === "correo") {
      if (!emailRegex.test(value) && value !== "") {
        setEmailError("Por favor ingresa un correo electrónico válido.");
      } else {
        setEmailError("");
      }
    }

    if (name === "password") {
      if (!passwordRegex.test(value) && value !== "") {
        setPasswordError(
          "La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y un carácter especial."
        );
      } else {
        setPasswordError("");
      }
    }

    newFormData[name] = value;
    setFormData(newFormData);
    setError("");
  };

  const handleSubmit = async () => {
  if (usernameError || emailError || passwordError) {
    setError("Corrige los errores en el formulario antes de continuar.");
    return;
  }

  if (!formData.nombre_usuario || !formData.correo || !formData.password) {
    setError("Todos los campos obligatorios deben estar completos.");
    return;
  }

  if (formData.password !== confirmPassword) {
    setError("Las contraseñas no coinciden");
    return;
  }

  try {
    
    await AsyncStorage.setItem("registrationData", JSON.stringify(formData));

    // Continuar al ConfirmationPage
    navigation.navigate("Confirmation");

  } catch (e) {
    console.error("Error guardando registro:", e);
    setError("Ocurrió un error guardando los datos.");
  }
};


  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <ChevronLeft size={28} color="#fff" />
      </TouchableOpacity>

      <View style={styles.card}>
        <Image source={require("../../assets/img/Logo.png")} style={styles.logo} />

        {error !== "" && <Text style={styles.errorBox}>{error}</Text>}

        {/* Nombre de Usuario */}
        <Text style={styles.label}>
          Nombre de usuario <Text style={styles.required}>*</Text>
        </Text>

        <View style={styles.inputContainer}>
          <User color="#666" size={20} style={styles.icon} />
          <TextInput
            placeholder="Nombre de usuario"
            style={styles.input}
            value={formData.nombre_usuario}
            onChangeText={(text) => handleChange("nombre_usuario", text)}
          />
        </View>
        {usernameError ? <Text style={styles.error}>{usernameError}</Text> : null}

        {/* Correo */}
        <Text style={styles.label}>
          Correo electrónico <Text style={styles.required}>*</Text>
        </Text>

        <View style={styles.inputContainer}>
          <Mail color="#666" size={20} style={styles.icon} />
          <TextInput
            placeholder="Correo electrónico"
            style={styles.input}
            value={formData.correo}
            onChangeText={(text) => handleChange("correo", text)}
          />
        </View>
        {emailError ? <Text style={styles.error}>{emailError}</Text> : null}

        {/* Contraseña */}
        <Text style={styles.label}>
          Contraseña <Text style={styles.required}>*</Text>
        </Text>

        <View style={styles.inputContainer}>
          <Lock color="#666" size={20} style={styles.icon} />
          <TextInput
            placeholder="Contraseña"
            secureTextEntry={!showPassword}
            style={styles.input}
            value={formData.password}
            onChangeText={(text) => handleChange("password", text)}
          />

          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </TouchableOpacity>
        </View>
        {passwordError ? <Text style={styles.error}>{passwordError}</Text> : null}

        {/* Confirmar contraseña */}
        <Text style={styles.label}>
          Confirmar Contraseña <Text style={styles.required}>*</Text>
        </Text>

        <View style={styles.inputContainer}>
          <Lock color="#666" size={20} style={styles.icon} />
          <TextInput
            placeholder="Confirmar contraseña"
            secureTextEntry={!showConfirmPassword}
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <TouchableOpacity
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            style={styles.eyeButton}
          >
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </TouchableOpacity>
        </View>

        {/* Botón Siguiente */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitText}>Siguiente</Text>
        </TouchableOpacity>

        {/* Google */}
        <TouchableOpacity style={styles.googleBtn}>
          <Image
            source={require("../../assets/img/google.png")}
            style={{ width: 20, height: 20 }}
          />
          <Text style={styles.googleText}>Continuar con Google</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// 📌 Estilos versión móvil
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#171717",
    padding: 20,
    justifyContent: "center",
  },
  backBtn: {
    position: "absolute",
    top: 40,
    left: 20,
  },
  backText: {
    color: "#fff",
    fontSize: 30,
  },
  card: {
    backgroundColor: "#232323",
    padding: 20,
    borderRadius: 16,
  },
  logo: {
    width: 200,
    height: 70,
    resizeMode: "contain",
    alignSelf: "center",
    marginBottom: 20,
  },
  label: {
    color: "#ccc",
    marginBottom: 6,
    marginTop: 10,
  },
  required: { color: "red" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    borderColor: "#ccc",
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    color: "#000",
  },
  icon: { marginRight: 8 },
  eyeButton: {
    padding: 5,
  },
  error: { color: "red", fontSize: 12, marginTop: 4 },
  errorBox: {
    backgroundColor: "red",
    color: "#fff",
    padding: 10,
    textAlign: "center",
    borderRadius: 8,
    marginBottom: 10,
  },
  submitBtn: {
    backgroundColor: "#2563EB",
    padding: 12,
    marginTop: 20,
    borderRadius: 8,
  },
  submitText: {
    textAlign: "center",
    color: "white",
    fontWeight: "bold",
  },
  googleBtn: {
    backgroundColor: "white",
    padding: 12,
    marginTop: 20,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  googleText: { color: "#444", fontWeight: "600" },
});
