import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
  Alert,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "../types/navigation";
// Removido: import { apiClient } - no es necesario

type PomodoroRouteProp = RouteProp<RootStackParamList, "PomodoroIntro">;
type NavProp = NativeStackNavigationProp<RootStackParamList>;

interface PomodoroConfig {
  workTime: number;
  breakTime: number;
}

const exampleMethod = {
  id_metodo: 1,
  nombre_metodo: "Método Pomodoro",
  descripcion:
    "Técnica de gestión de tiempo. Divide el tiempo de estudio en intervalos de trabajo y descanso",
  beneficios: [
    { id_beneficio: 1, descripcion_beneficio: "Aumenta la concentración" },
    { id_beneficio: 2, descripcion_beneficio: "Reduce la fatiga mental" },
    { id_beneficio: 3, descripcion_beneficio: "Optimiza el tiempo de estudio" },
    { id_beneficio: 4, descripcion_beneficio: "Mejora la organización" },
  ],
  icon: "🍅",
  color_hexa: "#EF4444",
};

const PomodoroIntroScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<PomodoroRouteProp>();
  const methodIdParam = route.params?.methodId;
  const passedMethod = route.params?.methodId;

  const [method, setMethod] = useState<any | null>(passedMethod ?? null);
  const [loading, setLoading] = useState<boolean>(!passedMethod);
  const [error, setError] = useState<string>("");
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [config, setConfig] = useState<PomodoroConfig>({ workTime: 25, breakTime: 5 });

  useEffect(() => {
    // load config from storage
    (async () => {
      try {
        const saved = await AsyncStorage.getItem("pomodoro-config");
        if (saved) setConfig(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    if (passedMethod) {
      setMethod(passedMethod);
      setLoading(false);
      return;
    }

    const fetchMethod = async () => {
      try {
        setLoading(true);
        setError("");
        // Fallback a ejemplo local (puedes integrar con tu API aquí si lo necesitas)
        setMethod(exampleMethod);
      } catch (err) {
        console.warn("Error fetching method", err);
        setError("Error al cargar los datos del método.");
      } finally {
        setLoading(false);
      }
    };

    if (!method) fetchMethod();
  }, [methodIdParam, passedMethod]);

  const openConfig = () => setShowConfigModal(true);
  const closeConfig = () => setShowConfigModal(false);

  const saveConfig = async () => {
    try {
      await AsyncStorage.setItem("pomodoro-config", JSON.stringify(config));
      setShowConfigModal(false);
      Alert.alert("Configuración guardada", "Tus tiempos fueron guardados correctamente.");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo guardar la configuración.");
    }
  };

  const startPomodoro = async () => {
    try {
      await AsyncStorage.setItem("pomodoro-config", JSON.stringify(config));
    } catch (e) {
      // no blocking
    }
    if (method?.id_metodo) {
      navigation.navigate("PomodoroExecute", { methodId: Number(method) });
    } else if (methodIdParam) {
      navigation.navigate("PomodoroExecute", { methodId: Number(methodIdParam) });
    } else {
      // fallback
      navigation.navigate("PomodoroExecute", { methodId: 1 });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0b0b0b" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#EF4444" />
          <Text style={styles.loadingText}>Cargando método...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !method) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0b0b0b" />
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Error al cargar datos</Text>
          <Text style={styles.errorMsg}>{error || "No se encontró el método."}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.navigate("StudyMethods")}>
            <Text style={styles.retryText}>Volver a métodos</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const methodColor = method.color_hexa || "#EF4444";
  const emoji = method.icon || "🍅";

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0b0b0b" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Técnica {method.nombre_metodo}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.pill, { borderColor: `${methodColor}33` }]}>
            <Text style={[styles.pillText, { color: methodColor }]}>Técnica Pomodoro</Text>
          </View>

          <View style={[styles.imageBox, { borderColor: `${methodColor}33` }]}>
            <Text style={styles.emoji}>{emoji}</Text>
          </View>

          <Text style={styles.title}>Domina tu Tiempo de Estudio</Text>
          <Text style={styles.subtitle}>{method.descripcion}</Text>

          <View style={styles.tagsRow}>
            <View style={[styles.tag, { borderColor: `${methodColor}22` }]}>
              <View style={[styles.tagDot, { backgroundColor: methodColor }]} />
              <Text style={styles.tagText}>Técnica Probada</Text>
            </View>
            <View style={[styles.tag, { borderColor: "rgba(245,158,11,0.14)" }]}>
              <View style={[styles.tagDot, { backgroundColor: "#F59E0B" }]} />
              <Text style={styles.tagText}>Mejor Productividad</Text>
            </View>
            <View style={[styles.tag, { borderColor: "rgba(250,204,21,0.12)" }]}>
              <View style={[styles.tagDot, { backgroundColor: "#FBBF24" }]} />
              <Text style={styles.tagText}>Menos Fatiga</Text>
            </View>
          </View>
        </View>

        {/* How it works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>¿Cómo Funciona la Técnica?</Text>
          <Text style={styles.sectionSubtitle}>Un método simple pero efectivo para mejorar tu concentración y productividad</Text>

          <View style={styles.steps}>
            <View style={[styles.stepCard, { borderLeftColor: methodColor }]}>
              <Text style={styles.stepTitle}>1. Elige una tarea específica</Text>
              <Text style={styles.stepText}>Selecciona una actividad concreta que quieras completar en el tiempo del pomodoro.</Text>
            </View>

            <View style={[styles.stepCard, { borderLeftColor: "#F59E0B" }]}>
              <Text style={styles.stepTitle}>2. Trabaja durante {config.workTime} minutos</Text>
              <Text style={styles.stepText}>Configura un temporizador y concéntrate en la tarea. Evita distracciones.</Text>
            </View>

            <View style={[styles.stepCard, { borderLeftColor: "#FBBF24" }]}>
              <Text style={styles.stepTitle}>3. Descansa {config.breakTime} minutos</Text>
              <Text style={styles.stepText}>Toma un breve descanso, estírate y vuelve con energía.</Text>
            </View>
          </View>
        </View>

        {/* Benefits */}
        {Array.isArray(method.beneficios) && method.beneficios.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Beneficios</Text>
            <View style={styles.benefitsGrid}>
              {method.beneficios.map((b: any, i: number) => (
                <View key={b.id_beneficio || i} style={[styles.benefitCard, { borderLeftColor: methodColor }]}>
                  <View style={styles.benefitIndex}>
                    <Text style={styles.benefitIndexText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.benefitText}>{b.descripcion_beneficio}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.configBtn} onPress={() => openConfig()}>
            <Text style={styles.configBtnText}>Configurar Técnica</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.startBtn, { backgroundColor: methodColor }]} onPress={() => startPomodoro()}>
            <Text style={styles.startBtnText}>Comenzar Técnica Pomodoro</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>

      {/* Config modal */}
      <Modal visible={showConfigModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Configurar Técnica</Text>
              <TouchableOpacity onPress={() => closeConfig()}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Tiempo de trabajo (minutos)</Text>
              <TextInput
                keyboardType="numeric"
                value={String(config.workTime)}
                onChangeText={(t) => {
                  const n = Math.max(1, Math.min(180, parseInt(t || "0")));
                  setConfig((s) => ({ ...s, workTime: Number.isNaN(n) ? 25 : n }));
                }}
                style={styles.input}
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Tiempo de descanso (minutos)</Text>
              <TextInput
                keyboardType="numeric"
                value={String(config.breakTime)}
                onChangeText={(t) => {
                  const n = Math.max(1, Math.min(60, parseInt(t || "0")));
                  setConfig((s) => ({ ...s, breakTime: Number.isNaN(n) ? 5 : n }));
                }}
                style={styles.input}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => closeConfig()}>
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnSave} onPress={() => saveConfig()}>
                <Text style={styles.modalBtnSaveText}>Guardar Configuración</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default PomodoroIntroScreen;

/* --------------------------- Styles --------------------------- */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0b0b0b" },
  header: {
    height: 64,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "transparent",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: { color: "#fff", fontSize: 16 },
  headerTitle: { color: "#E6EEF8", fontSize: 18, fontWeight: "700" },

  container: {
    paddingHorizontal: 18,
    paddingBottom: 60,
  },

  hero: {
    alignItems: "center",
    marginTop: 12,
    marginBottom: 18,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 12,
  },
  pillText: { fontWeight: "700", fontSize: 13 },

  imageBox: {
    width: 88,
    height: 88,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  emoji: { fontSize: 36 },

  title: {
    color: "#E6EEF8",
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    maxWidth: 760,
    lineHeight: 20,
  },

  tagsRow: { flexDirection: "row", marginTop: 14, gap: 8, flexWrap: "wrap", justifyContent: "center" },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
  },
  tagDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  tagText: { color: "#C7D2FE", fontWeight: "600", fontSize: 13 },

  section: { marginTop: 20 },
  sectionTitle: { color: "#E6EEF8", fontSize: 20, fontWeight: "800", textAlign: "center", marginBottom: 8 },
  sectionSubtitle: { color: "#9CA3AF", fontSize: 14, textAlign: "center", marginBottom: 12 },

  steps: { marginTop: 8, gap: 12 },
  stepCard: {
    backgroundColor: "#0f0f10",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 6,
    borderLeftColor: "#EF4444",
  },
  stepTitle: { color: "#fff", fontWeight: "800", marginBottom: 6 },
  stepText: { color: "#9CA3AF" },

  benefitsGrid: { marginTop: 8, gap: 10 },
  benefitCard: {
    flexDirection: "row",
    backgroundColor: "#0f0f10",
    padding: 12,
    borderRadius: 10,
    alignItems: "flex-start",
    borderLeftWidth: 6,
    marginBottom: 8,
  },
  benefitIndex: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  benefitIndexText: { color: "#fff", fontWeight: "800" },
  benefitText: { color: "#cbd5e1", flex: 1 },

  actions: {
    marginTop: 18,
    alignItems: "center",
    gap: 12,
  },
  configBtn: {
    width: "100%",
    backgroundColor: "#1f2937",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  configBtnText: { color: "#fff", fontWeight: "700" },

  startBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  startBtnText: { color: "#fff", fontWeight: "800" },

  /* modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#0f0f10",
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  modalTitle: { color: "#E6EEF8", fontSize: 18, fontWeight: "800" },
  closeIcon: { color: "#9CA3AF", fontSize: 18 },

  modalBody: { marginTop: 6 },
  inputLabel: { color: "#9CA3AF", marginBottom: 8, fontWeight: "600" },
  input: {
    backgroundColor: "#111827",
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    borderRadius: 10,
    color: "#fff",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.03)",
  },

  modalActions: { flexDirection: "row", gap: 12, marginTop: 14 },
  modalBtnCancel: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: "#1f2937", alignItems: "center" },
  modalBtnCancelText: { color: "#cbd5e1", fontWeight: "700" },
  modalBtnSave: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: "#EF4444", alignItems: "center" },
  modalBtnSaveText: { color: "#fff", fontWeight: "800" },

  /* states */
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 18 },
  loadingText: { color: "#cbd5e1", marginTop: 12 },
  errorTitle: { color: "#fff", fontSize: 18, fontWeight: "800", marginBottom: 8 },
  errorMsg: { color: "#9CA3AF", textAlign: "center", marginBottom: 12 },
  retryBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, backgroundColor: "#2563EB" },
  retryText: { color: "#fff", fontWeight: "700" },
});