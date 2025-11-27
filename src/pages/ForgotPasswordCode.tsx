import React, { useRef, useState } from "react";
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
import {ChevronLeft} from "lucide-react-native";

import type { RootStackParamList } from "../types/navigation";

const ForgotPasswordCodePage = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);

  const inputRefs = useRef<TextInput[]>([]);

  // Manejar cambios en los inputs
  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Pasar al siguiente input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Manejar backspace
  const handleKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async () => {
    const fullCode = code.join("");

    if (fullCode.length !== 6) {
      Alert.alert("Código incompleto", "Debes ingresar los 6 dígitos.");
      return;
    }

    setLoading(true);

    try {
      // Guardar código
      await AsyncStorage.setItem("resetCode", fullCode);

      // Ir a pantalla de restablecer contraseña
      navigation.navigate("ForgotPasswordReset");
    } catch (e) {
      Alert.alert("Error", "No se pudo continuar");
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
          Hemos enviado un código de verificación a tu correo para poder restablecer tu contraseña.
        </Text>

        {/* 6 Inputs */}
        <View style={styles.codeRow}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                if (ref) inputRefs.current[index] = ref;
              }}
              style={styles.codeInput}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={(val) => handleInputChange(index, val.replace(/[^0-9]/g, ""))}
              onKeyPress={({ nativeEvent }) =>
                handleKeyPress(index, nativeEvent.key)
              }
            />
          ))}
        </View>

        {/* Botón */}
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

export default ForgotPasswordCodePage;

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
    zIndex: 10,
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
    marginBottom: 25,
  },
  instructions: {
    color: "#d1d5db",
    textAlign: "center",
    fontSize: 16,
    marginBottom: 25,
  },
  codeRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 25,
  },
  codeInput: {
    width: 50,
    height: 55,
    backgroundColor: "#232323",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#2563EB",
    textAlign: "center",
    fontSize: 22,
    color: "white",
  },
  submitBtn: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 10,
  },
  submitText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
  },
});
