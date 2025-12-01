import React, { useEffect, useState, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { SessionData, PomodoroConfig } from "../types/session";
import { StudyMethod } from "../types/studyMethod";

import {
  CheckCircle,
  Clock as ClockIcon,
  Coffee,
  SkipForward,
  ArrowLeft,
} from "lucide-react-native";

/* -------------------- Types -------------------- */
type NavProp = NativeStackNavigationProp<RootStackParamList>;
type RoutePropType = RouteProp<RootStackParamList, "PomodoroExecute">;

/* -------------------- Timer Component -------------------- */
const Timer: React.FC<{
  initialMinutes: number;
  onComplete?: () => void;
  running?: boolean;
  color?: string;
}> = ({ initialMinutes, onComplete, running = true, color = "#EF4444" }) => {
  const [secondsLeft, setSecondsLeft] = useState(initialMinutes * 60);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    setSecondsLeft(initialMinutes * 60);
  }, [initialMinutes]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          onComplete?.();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, initialMinutes, onComplete]);

  const pad = (n: number) => String(n).padStart(2, "0");
  const mm = Math.floor(secondsLeft / 60);
  const ss = secondsLeft % 60;

  return (
    <View style={timerStyles.container}>
      <View style={[timerStyles.circle, { borderColor: color }]}>
        <Text style={timerStyles.timeText}>
          {pad(mm)}:{pad(ss)}
        </Text>
      </View>
    </View>
  );
};

const timerStyles = StyleSheet.create({
  container: { alignItems: "center", marginTop: 8 },
  circle: {
    width: 140,
    height: 140,
    borderRadius: 90,
    borderWidth: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  timeText: { fontSize: 26, color: "#fff", fontWeight: "800" },
});

/* -------------------- ProgressCircle Component -------------------- */
const ProgressCircle: React.FC<{ percentage: number; size?: number; color?: string }> = ({
  percentage,
  size = 120,
  color = "#3B82F6",
}) => {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 8,
        borderColor: color,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "transparent",
      }}
    >
      <Text style={{ fontSize: 22, fontWeight: "900", color }}>{percentage}%</Text>
    </View>
  );
};

/* -------------------- Main Screen -------------------- */
const PomodoroExecutionScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const methodIdParam = route.params?.methodId?.toString?.() ?? undefined;
  const resumeProgressParam = (route.params as any)?.resumeProgress as number | undefined;
  const resumeSessionIdParam = (route.params as any)?.sessionId as string | undefined;

  const [method, setMethod] = useState<StudyMethod | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [config, setConfig] = useState<PomodoroConfig>({ workTime: 25, breakTime: 5 });

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [timerCompleted, setTimerCompleted] = useState<boolean>(false);
  const [isResuming, setIsResuming] = useState<boolean>(false);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [progressPercentage, setProgressPercentage] = useState<number>(0);
  const [canFinishMethod, setCanFinishMethod] = useState<boolean>(false);
  const [showFinishLaterModal, setShowFinishLaterModal] = useState<boolean>(false);
  const [runningTimer, setRunningTimer] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("pomodoro-config");
        if (raw) {
          const parsed = JSON.parse(raw);
          setConfig((prev) => ({ ...prev, ...(parsed || {}) }));
        }
      } catch (e) {}
    })();
  }, []);

  useEffect(() => {
    if (resumeProgressParam != null && resumeSessionIdParam) {
      const prog = resumeProgressParam;
      setIsResuming(true);
      setSessionData({
        id: resumeSessionIdParam,
        methodId: Number(methodIdParam ?? 0),
        id_metodo_realizado: 0,
        startTime: new Date().toISOString(),
        progress: prog,
        status: prog === 100 ? "completado" : "en_progreso",
      });
      if (prog === 20) {
        setCurrentStep(1); setProgressPercentage(20);
      } else if (prog === 60) {
        setCurrentStep(2); setProgressPercentage(60); setCanFinishMethod(true);
      } else if (prog === 100) {
        setCurrentStep(2); setProgressPercentage(100); setCanFinishMethod(true);
      }
    } else {
      (async () => {
        try {
          const resumeMethod = await AsyncStorage.getItem("resume-method");
          const resumeProg = await AsyncStorage.getItem("resume-progress");
          const resumeType = await AsyncStorage.getItem("resume-method-type");
          if (resumeMethod && resumeMethod === String(methodIdParam) && resumeType === "pomodoro") {
            const prog = parseInt(resumeProg || "0");
            if (prog === 20) { setCurrentStep(1); setProgressPercentage(20); }
            else if (prog === 60) { setCurrentStep(2); setProgressPercentage(60); setCanFinishMethod(true); }
            else if (prog === 100) { setCurrentStep(2); setProgressPercentage(100); setCanFinishMethod(true); }
            setIsResuming(true);
          }
        } catch (e) {}
      })();
    }
  }, [resumeProgressParam, resumeSessionIdParam, methodIdParam]);

  useEffect(() => {
    const fetchMethod = async () => {
      setLoading(true);
      try {
        setMethod({
          id_metodo: Number(methodIdParam) || 1,
          nombre_metodo: "Técnica Pomodoro",
          titulo: "Técnica Pomodoro",
          descripcion: "Divide tu tiempo en bloques de trabajo y descanso",
          color_hexa: "#EF4444",
          beneficios: [],
        });
      } catch (err) {
        setMethod({ id_metodo: Number(methodIdParam) || 1, nombre_metodo: "Técnica Pomodoro", titulo: "Técnica Pomodoro", beneficios: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchMethod();
  }, [methodIdParam]);

  const startSession = async () => {
    try {
      const fake = { id: String(Date.now()), id_metodo_realizado: Date.now() };
      setSessionData({
        id: fake.id,
        methodId: Number(methodIdParam),
        id_metodo_realizado: fake.id_metodo_realizado,
        startTime: new Date().toISOString(),
        progress: 20,
        status: "en_progreso",
      });
      await AsyncStorage.setItem("pomodoro-session", JSON.stringify(fake));
      setProgressPercentage(20);
      Alert.alert("Sesión iniciada", "Se ha iniciado la sesión de Pomodoro.");
    } catch (err) {
      Alert.alert("Error", "No se pudo iniciar la sesión");
    }
  };

  const updateSessionProgress = async (progress: number, status: "en_progreso" | "completado" = "en_progreso") => {
    try {
      const sessionId = sessionData?.id || (await AsyncStorage.getItem("activeMethodId"));
      if (!sessionId) return;
      const s = await AsyncStorage.getItem("pomodoro-session");
      if (s) {
        const parsed = JSON.parse(s);
        parsed.progreso = progress;
        parsed.estado = status;
        await AsyncStorage.setItem("pomodoro-session", JSON.stringify(parsed));
      }
      setProgressPercentage(progress);
      if (sessionData) setSessionData({ ...sessionData, progress, status });
    } catch (err) {}
  };

  const handleTimerComplete = () => {
    setTimerCompleted(true);
    if (currentStep === 2) setCanFinishMethod(true);
  };

  const nextStep = async () => {
    if (currentStep > 0 && !timerCompleted) {
      Alert.alert("Espera", "Espera a que termine el temporizador o pulsa 'Saltar Paso'.");
      return;
    }

    if (currentStep === 0 && !isResuming) {
      setCurrentStep(1);
      setTimerCompleted(false);
      await startSession();
      return;
    }

    if (currentStep === 1) {
      setCurrentStep(2);
      setTimerCompleted(false);
      await updateSessionProgress(60);
      return;
    }

    if (currentStep === 2) {
      setCurrentStep(1);
      setTimerCompleted(false);
      await updateSessionProgress(60);
      setCanFinishMethod(true);
      return;
    }
  };

  const skipStep = async () => {
    if (currentStep === 1) {
      setCurrentStep(2);
      setTimerCompleted(false);
      await updateSessionProgress(20);
      return;
    }
    if (currentStep === 2) {
      setCurrentStep(1);
      setTimerCompleted(false);
      return;
    }
  };

  const finishMethod = async () => {
    setProgressPercentage(100);
    await updateSessionProgress(100, "completado");
    await AsyncStorage.removeItem("pomodoro-session");
    await AsyncStorage.removeItem("activeMethodId");
    Alert.alert("Completado", `Sesión de ${method?.titulo || "Pomodoro"} guardada`, [
      { text: "OK", onPress: () => navigation.navigate("StudyMethods" as any) },
    ]);
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

  if (!method) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0b0b0b" />
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>No se encontró el método</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.navigate("StudyMethods" as any)}>
            <Text style={styles.retryText}>Volver a métodos</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const methodColor = method.color_hexa || "#EF4444";
  const steps = [
    {
      id: 0,
      title: "1. Elige una tarea",
      icon: CheckCircle,
      description: "Escoge una actividad concreta que quieras completar en esta sesión.",
      instruction: "Selecciona una tarea que puedas medir.",
      hasTimer: false,
    },
    {
      id: 1,
      title: `2. Trabaja durante ${config.workTime} minutos`,
      icon: ClockIcon,
      description: "Evita distracciones y concéntrate en la tarea.",
      instruction: `Trabaja durante ${config.workTime} minutos.`,
      hasTimer: true,
      timerMinutes: config.workTime,
    },
    {
      id: 2,
      title: `3. Descanso ${config.breakTime} minutos`,
      icon: Coffee,
      description: "Relájate y estírate durante el tiempo de descanso.",
      instruction: `Descansa ${config.breakTime} minutos.`,
      hasTimer: true,
      timerMinutes: config.breakTime,
    },
  ];
  const currentStepData = steps[currentStep];
  const IconComponent = currentStepData.icon;

  const getPomodoroColorByPercentage = (pct: number) => {
    if (pct === 0) return "#9CA3AF";
    if (pct === 60) return "#3B82F6";
    if (pct === 100) return "#22C55E";
    return "#FACC15";
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0b0b0b" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color="#fff" size={18} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: methodColor }]}>{method.titulo}</Text>
        {sessionData && currentStep >= 2 ? (
          <TouchableOpacity style={styles.finishLaterBtn} onPress={() => setShowFinishLaterModal(true)}>
            <Text style={styles.finishLaterText}>Terminar más tarde</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 120 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.progressContainer}>
          <ProgressCircle
            percentage={progressPercentage}
            size={140}
            color={getPomodoroColorByPercentage(progressPercentage)}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            {IconComponent ? <IconComponent color="#fff" size={18} /> : null}
            <Text style={[styles.cardTitle, { color: methodColor }]}>{currentStepData.title}</Text>
          </View>

          <Text style={styles.cardDesc}>{currentStepData.description}</Text>

          <View style={styles.instructionBox}>
            <Text style={styles.instructionText}>{currentStepData.instruction}</Text>
          </View>

          {currentStep === 0 && (
            <View style={[styles.tipBox, { borderLeftColor: methodColor }]}>
              <Text style={styles.tipText}>💡 Tip: define tareas concretas (ej. "resolver 10 ejercicios").</Text>
            </View>
          )}

          {currentStepData.hasTimer && (
            <View style={{ marginTop: 8 }}>
              <Timer
                initialMinutes={currentStepData.timerMinutes ?? 1}
                onComplete={handleTimerComplete}
                running={runningTimer}
                color={methodColor}
              />
            </View>
          )}
        </View>

        <View style={styles.controls}>
          {currentStep === 0 && (
            <TouchableOpacity onPress={() => nextStep()} style={[styles.primaryBtn, { backgroundColor: methodColor }]}>
              <Text style={styles.primaryBtnText}>Comenzar trabajo</Text>
            </TouchableOpacity>
          )}

          {(currentStep === 1 || currentStep === 2) && (
            <View style={styles.row}>
              <TouchableOpacity onPress={() => skipStep()} style={[styles.ghostBtn]}>
                <SkipForward color="#fff" size={16} />
                <Text style={styles.ghostText}>Saltar Paso</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => nextStep()}
                disabled={!timerCompleted}
                style={[
                  styles.secondaryBtn,
                  { backgroundColor: timerCompleted ? "#22C55E" : "#6B7280" },
                ]}
              >
                <Text style={styles.secondaryText}>Siguiente Paso</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => finishMethod()}
                disabled={!canFinishMethod}
                style={[
                  styles.secondaryBtn,
                  { backgroundColor: canFinishMethod ? "#EF4444" : "#6B7280" },
                ]}
              >
                <CheckCircle color="#fff" size={16} />
                <Text style={styles.secondaryText}>Finalizar Método</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={showFinishLaterModal} transparent animationType="fade">
        <View style={modalStyles.overlay}>
          <View style={modalStyles.card}>
            <Text style={modalStyles.title}>Terminar más tarde</Text>
            <Text style={modalStyles.body}>Se guardará tu progreso actual y podrás reanudar esta sesión después.</Text>
            <View style={modalStyles.actions}>
              <TouchableOpacity style={modalStyles.cancelBtn} onPress={() => setShowFinishLaterModal(false)}>
                <Text style={modalStyles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={modalStyles.okBtn}
                onPress={async () => {
                  await AsyncStorage.setItem("resume-method", String(method.id_metodo));
                  await AsyncStorage.setItem("resume-progress", String(progressPercentage || 20));
                  await AsyncStorage.setItem("resume-method-type", "pomodoro");
                  setShowFinishLaterModal(false);
                  Alert.alert("Guardado", "Sesión guardada para reanudar.");
                  navigation.navigate("StudyMethods" as any);
                }}
              >
                <Text style={modalStyles.okText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default PomodoroExecutionScreen;

/* -------------------- Styles -------------------- */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0b0b0b" },
  header: {
    height: 64,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  finishLaterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#EF4444",
  },
  finishLaterText: { color: "#fff", fontWeight: "700" },

  scrollContent: { paddingHorizontal: 18, paddingBottom: 120 },
  progressContainer: { alignItems: "center", marginTop: 8, marginBottom: 12 },

  card: {
    backgroundColor: "#0f0f10",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.03)",
    marginBottom: 12,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: "800" },
  cardDesc: { color: "#9CA3AF", marginBottom: 8 },
  instructionBox: {
    backgroundColor: "#1a1a1a",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  instructionText: { color: "#cbd5e1", fontStyle: "italic" },
  tipBox: { padding: 10, borderLeftWidth: 4, backgroundColor: "rgba(255,255,255,0.01)", borderRadius: 8, marginBottom: 8 },
  tipText: { color: "#cbd5e1" },

  controls: { marginTop: 12 },
  primaryBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },

  row: { flexDirection: "row", justifyContent: "space-between", gap: 8, alignItems: "center" },
  ghostBtn: {
    backgroundColor: "#9CA3AF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    flex: 1,
    justifyContent: "center",
  },
  ghostText: { color: "#fff", fontWeight: "700" },
  secondaryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    flex: 1,
    justifyContent: "center",
  },
  secondaryText: { color: "#fff", fontWeight: "700" },

  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#cbd5e1", marginTop: 12 },
  errorTitle: { color: "#fff", fontSize: 18, fontWeight: "800", marginBottom: 8 },
  retryBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, backgroundColor: "#2563EB" },
  retryText: { color: "#fff", fontWeight: "700" },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#0f0f10",
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  title: { color: "#E6EEF8", fontSize: 18, fontWeight: "800", marginBottom: 8 },
  body: { color: "#cbd5e1", marginBottom: 14 },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 12 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, backgroundColor: "#1f2937" },
  cancelText: { color: "#cbd5e1" },
  okBtn: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, backgroundColor: "#EF4444" },
  okText: { color: "#fff", fontWeight: "700" },
});