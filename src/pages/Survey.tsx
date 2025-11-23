// /mnt/data/Survey.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Feather";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import type { RegisterRequest } from "../types/user";

/**
 * SurveyPage - conversión fiel de la versión web a React Native (Expo).
 * Mejoras:
 * - Intenta leer registrationData y registrationFormData (robustez).
 * - Manejo robusto de respuesta del API (axios o fetch).
 * - Extra logs para debugging.
 */

// Datos exactamente como en tu web
const countries = [
  "Colombia", "México", "Argentina", "Estados Unidos", "Canadá", "España",
  "Brasil", "Chile", "Perú", "Alemania", "Francia", "Italia", "Reino Unido", "Japón"
];

const genders = [
  "Masculino", "Femenino", "Otro", "Prefiero no decir"
];

const distractions = [
  { value: "1", label: "Redes sociales" },
  { value: "2", label: "Mensajería instantánea" },
  { value: "3", label: "Notificaciones del teléfono" },
  { value: "4", label: "Correo electrónico" },
  { value: "5", label: "Plataformas de video" },
  { value: "6", label: "Juegos móviles o en línea" },
  { value: "7", label: "Scroll infinito" },
  { value: "8", label: "Compras online" },
  { value: "9", label: "Ruidos externos" },
  { value: "10", label: "Interrupciones de otras personas" },
  { value: "11", label: "Hambre o sed" },
  { value: "12", label: "Falta de comodidad" },
  { value: "13", label: "Desorden en el espacio de trabajo" },
  { value: "14", label: "Mascotas" },
  { value: "15", label: "Pensamientos intrusivos" },
  { value: "16", label: "Sueño/fatiga" },
  { value: "17", label: "Aburrimiento" },
  { value: "18", label: "Multitarea" },
  { value: "19", label: "Día soñando despierto" },
  { value: "20", label: "Estrés o ansiedad" },
];

const objectives = [
  { value: "1", label: "Estudio y Aprendizaje" },
  { value: "2", label: "Trabajo y Productividad" },
  { value: "3", label: "Tareas Domésticas y Organización Personal" },
  { value: "4", label: "Creatividad y Proyectos Personales" },
  { value: "5", label: "Salud Mental y Bienestar" },
];

// Reusable modal picker (strings or {value,label})
function ModalPicker({
  visible,
  onClose,
  options,
  onSelect,
  selectedValue,
  title,
}: {
  visible: boolean;
  onClose: () => void;
  options: (string | { value: string; label?: string })[];
  onSelect: (value: string) => void;
  selectedValue?: string;
  title?: string;
}) {
  const renderItem = ({ item }: { item: any }) => {
    const label = typeof item === "string" ? item : item.label ?? item.value;
    const value = typeof item === "string" ? item : item.value;
    const selected = value === selectedValue;
    return (
      <TouchableOpacity
        style={[styles.optionItem, selected && styles.optionItemSelected]}
        onPress={() => {
          onSelect(value);
          onClose();
        }}
      >
        <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          {title ? <Text style={styles.modalTitle}>{title}</Text> : null}
          <FlatList
            data={options}
            keyExtractor={(it, idx) => (typeof it === "string" ? it : it.value) + idx}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
          />
          <TouchableOpacity style={styles.modalClose} onPress={onClose}>
            <Text style={styles.modalCloseText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// Date picker modal (día/mes/año) - mantiene formato YYYY-MM-DD
function DatePickerModal({
  visible,
  onClose,
  onConfirm,
  initialDate,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: (dateIso: string) => void;
  initialDate?: string | Date;
}) {
  const now = new Date();
  const init = initialDate ? (typeof initialDate === "string" ? new Date(initialDate) : initialDate) : now;
  const [day, setDay] = useState<string>(String(init.getDate()).padStart(2, "0"));
  const [month, setMonth] = useState<string>(String(init.getMonth() + 1).padStart(2, "0"));
  const [year, setYear] = useState<string>(String(init.getFullYear()));

  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
  const currentYear = now.getFullYear();
  const years = Array.from({ length: 120 }, (_, i) => String(currentYear - i));

  const confirm = () => {
    const iso = `${year}-${month}-${day}`;
    onConfirm(iso);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Selecciona fecha</Text>

          <View style={styles.dateColumns}>
            <View style={styles.dateColumn}>
              <Text style={styles.dateLabel}>Día</Text>
              <FlatList
                data={days}
                keyExtractor={(d) => d}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.dateItem, item === day && styles.dateItemSelected]}
                    onPress={() => setDay(item)}
                  >
                    <Text style={[styles.dateItemText, item === day && styles.dateItemTextSelected]}>{item}</Text>
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
              />
            </View>

            <View style={styles.dateColumn}>
              <Text style={styles.dateLabel}>Mes</Text>
              <FlatList
                data={months}
                keyExtractor={(d) => d}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.dateItem, item === month && styles.dateItemSelected]}
                    onPress={() => setMonth(item)}
                  >
                    <Text style={[styles.dateItemText, item === month && styles.dateItemTextSelected]}>{item}</Text>
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
              />
            </View>

            <View style={styles.dateColumn}>
              <Text style={styles.dateLabel}>Año</Text>
              <FlatList
                data={years}
                keyExtractor={(y) => y}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.dateItem, item === year && styles.dateItemSelected]}
                    onPress={() => setYear(item)}
                  >
                    <Text style={[styles.dateItemText, item === year && styles.dateItemTextSelected]}>{item}</Text>
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </View>

          <View style={styles.modalButtonsRow}>
            <TouchableOpacity style={styles.modalAction} onPress={onClose}>
              <Text style={styles.modalActionText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalAction, styles.modalActionPrimary]} onPress={confirm}>
              <Text style={[styles.modalActionText, styles.modalActionPrimaryText]}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function SurveyPage() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const [surveyData, setSurveyData] = useState({
    fecha_nacimiento: "" as string, // ISO YYYY-MM-DD
    pais: "",
    genero: "",
    distraction1: "",
    distraction2: "",
    objective: "",
    hours: "",
    minutes: "",
    period: "",
  });

  const [pickerConfig, setPickerConfig] = useState<{
    visible: boolean;
    options: (string | { value: string; label?: string })[];
    field: keyof typeof surveyData | null;
    title?: string;
  }>({ visible: false, options: [], field: null });

  const [dateModalVisible, setDateModalVisible] = useState(false);

  const isInitialFieldsComplete =
    surveyData.fecha_nacimiento !== "" && surveyData.pais !== "" && surveyData.genero !== "";

  const openPicker = (
    field: keyof typeof surveyData,
    options: (string | { value: string; label?: string })[],
    title?: string
  ) => {
    setPickerConfig({ visible: true, options, field, title });
  };

  const closePicker = () => setPickerConfig({ visible: false, options: [], field: null });

  const handleSelectFromPicker = (value: string) => {
    if (!pickerConfig.field) return;

    // Evitar duplicado de distracciones
    if (pickerConfig.field === "distraction1" && surveyData.distraction2 === value) {
      Alert.alert("Atención", "Ya seleccionaste esta distracción en la segunda opción.");
      return;
    }
    if (pickerConfig.field === "distraction2" && surveyData.distraction1 === value) {
      Alert.alert("Atención", "Ya seleccionaste esta distracción en la primera opción.");
      return;
    }

    setSurveyData((prev) => ({ ...prev, [pickerConfig.field as string]: value }));
  };

  const handleDateConfirm = (isoDate: string) => {
    setSurveyData((prev) => ({ ...prev, fecha_nacimiento: isoDate }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      // Intentar múltiples claves por robustez (register/mobile/web)
      const possibleKeys = ["registrationData", "registrationFormData", "registration_data"];
      let storedData: string | null = null;
      for (const k of possibleKeys) {
        const v = await AsyncStorage.getItem(k);
        if (v) {
          storedData = v;
          console.log(`Survey: found registration payload in AsyncStorage key "${k}"`);
          break;
        }
      }

      if (!storedData) {
        // No se encontró: avisar con detalle y sugerencia
        const msg = "No se encontraron datos de registro. Asegúrate de que el formulario de registro guarde los datos en AsyncStorage con la clave 'registrationData'.";
        setError(msg);
        Alert.alert("Error", msg);
        setLoading(false);
        return;
      }

      const formData: RegisterRequest = JSON.parse(storedData);

      // fecha_nacimiento fallback logic (web parity)
      let fechaNacimientoFromRegister: string | null = null;
      if (formData.fecha_nacimiento) {
        if (typeof formData.fecha_nacimiento === "string") {
          fechaNacimientoFromRegister = formData.fecha_nacimiento;
        } else {
          const d = new Date(formData.fecha_nacimiento as any);
          if (!isNaN(d.getTime())) fechaNacimientoFromRegister = d.toISOString().split("T")[0];
        }
      }

      // distracciones array
      const distracciones = [
        surveyData.distraction1 ? parseInt(surveyData.distraction1) : null,
        surveyData.distraction2 ? parseInt(surveyData.distraction2) : null,
      ].filter((id): id is number => id !== null && !isNaN(id));

      // Validaciones finales antes de enviar
      if (distracciones.length === 0) {
        Alert.alert("Error", "Selecciona al menos una distracción.");
        setLoading(false);
        return;
      }

      // horario favorito (si se empieza a llenar, debe completarse)
      const anyTimeFieldFilled = surveyData.hours || surveyData.minutes || surveyData.period;
      const isScheduleComplete = surveyData.hours && surveyData.minutes && surveyData.period;
      if (anyTimeFieldFilled && !isScheduleComplete) {
        Alert.alert("Error", "Si vas a establecer un horario favorito, completa horas, minutos y AM/PM.");
        setLoading(false);
        return;
      }

      let horarioFav: string | null = null;
      if (isScheduleComplete) {
        const h = parseInt(surveyData.hours);
        let hours24 = h;
        if (surveyData.period === "PM" && surveyData.hours !== "12") hours24 = h + 12;
        if (surveyData.period === "AM" && surveyData.hours === "12") hours24 = 0;
        horarioFav = `${String(hours24).padStart(2, "0")}:${surveyData.minutes.padStart(2, "0")}`;
      }

      const surveyFechaNacimiento = surveyData.fecha_nacimiento || null;

      const extendedPayload = {
        nombre_usuario: formData.nombre_usuario,
        correo: formData.correo,
        // backend espera "contrasena" en tu web; si tu backend usa "password", ajusta aquí
        contrasena: (formData as any).password ?? (formData as any).contrasena ?? "",
        fecha_nacimiento: surveyFechaNacimiento || fechaNacimientoFromRegister || "",
        pais: surveyData.pais || (formData as any).pais || "",
        genero: surveyData.genero || (formData as any).genero || "",
        horario_fav: horarioFav || "",
        intereses: [1, 2, 3],
        distracciones: distracciones,
        objetivo: surveyData.objective ? parseInt(surveyData.objective) : null,
      };

      console.log("Survey: sending payload to backend:", extendedPayload);

      // Llamada al API (usa tu apiClient / constantes)
      const { apiClient } = await import("../clientes/apiClient");
      const { API_ENDPOINTS } = await import("../utils/constants");

      // apiClient podría ser axios o fetch wrapper.
      const response = await apiClient.post(API_ENDPOINTS.USERS, extendedPayload);

      // Normalize response
      const status = (response && response.status) || null;
      const data = (response && response.data) ? response.data : (response && typeof response === "object" ? response : null);

      // Si status es 4xx o 5xx → error
      if (status && status >= 400) {
        const backendMsg = data?.message || data?.error || `Error ${status}`;
        throw new Error(backendMsg);
      }

      // ⭐ ACEPTAR el registro SIEMPRE que el backend NO mande un error
if (data?.error || data?.success === false) {
  // Si backend realmente envió error
  throw new Error(data.error || data.message || "Error en registro");
}

  // 🔥 Cerrar modales antes del Alert
  setPickerConfig({ visible: false, options: [], field: null });
  setDateModalVisible(false);

  // 🎉 Mostrar alerta de éxito
  Alert.alert("✅ Registro exitoso", "Se redirigirá al iniciar sesión.", [
    {
      text: "Aceptar",
      onPress: () => navigation.navigate("Login"),
     },
  ]);


    } catch (e: any) {
      // Mejor manejo de errores (muestra msg del backend si existe)
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        e?.message ||
        "Error al registrar usuario";
      setError(msg);
      console.error("Survey submit error:", e);
      // Mostrar alerta además del error inline
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  // prepare options for pickers (hours/minutes)
  const hoursOptions = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1).padStart(2, "0"), label: String(i + 1).padStart(2, "0") }));
  const minutesOptions = Array.from({ length: 60 }, (_, i) => ({ value: String(i).padStart(2, "0"), label: String(i).padStart(2, "0") }));
  const periodOptions = [{ value: "AM", label: "AM" }, { value: "PM", label: "PM" }];

  return (
    <LinearGradient colors={["#171717", "#1a1a1a"]} style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.card}>
          {/* Logo (ajusta la ruta si hace falta) */}
          <View style={{ alignItems: "center", marginBottom: 12 }}>
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>Focus Up</Text>
          </View>

          <Text style={styles.h1}>Información personal</Text>

          {/* Fecha */}
          <Text style={styles.label}>Fecha de nacimiento</Text>
          <TouchableOpacity style={styles.field} onPress={() => setDateModalVisible(true)}>
            <Text style={[styles.fieldText, !surveyData.fecha_nacimiento && styles.placeholder]}>
              {surveyData.fecha_nacimiento || "Selecciona una fecha"}
            </Text>
            <Icon name="calendar" size={18} color="#bbb" />
          </TouchableOpacity>

          {/* País */}
          <Text style={styles.label}>País</Text>
          <TouchableOpacity style={styles.field} onPress={() => openPicker("pais", countries, "Selecciona un país")}>
            <Text style={[styles.fieldText, !surveyData.pais && styles.placeholder]}>
              {surveyData.pais || "Selecciona un país"}
            </Text>
            <Icon name="map-pin" size={18} color="#bbb" />
          </TouchableOpacity>

          {/* Género */}
          <Text style={styles.label}>Género</Text>
          <TouchableOpacity style={styles.field} onPress={() => openPicker("genero", genders, "Selecciona un género")}>
            <Text style={[styles.fieldText, !surveyData.genero && styles.placeholder]}>
              {surveyData.genero || "Selecciona un género"}
            </Text>
            <Icon name="users" size={18} color="#bbb" />
          </TouchableOpacity>

          {!isInitialFieldsComplete ? (
            <View style={styles.noticeBox}>
              <Text style={styles.noticeText}>
                Completa fecha, país y género para continuar con la encuesta.
              </Text>
            </View>
          ) : null}

          {/* Resto de la encuesta (idéntica) */}
          {isInitialFieldsComplete && (
            <>
              <Text style={[styles.h1, { marginTop: 18 }]}>
                ¿Cuáles consideras que son tus 2 distracciones más comunes?
              </Text>

              <Text style={styles.label}>Primera distracción</Text>
              <TouchableOpacity style={styles.field} onPress={() => openPicker("distraction1", distractions, "Selecciona una distracción")}>
                <Text style={[styles.fieldText, !surveyData.distraction1 && styles.placeholder]}>
                  {surveyData.distraction1 ? (distractions.find(d => d.value === surveyData.distraction1)?.label) : "Selecciona una distracción"}
                </Text>
                <Icon name="alert-circle" size={18} color="#bbb" />
              </TouchableOpacity>

              <Text style={styles.label}>Segunda distracción</Text>
              <TouchableOpacity style={styles.field} onPress={() => openPicker("distraction2", distractions, "Selecciona una distracción")}>
                <Text style={[styles.fieldText, !surveyData.distraction2 && styles.placeholder]}>
                  {surveyData.distraction2 ? (distractions.find(d => d.value === surveyData.distraction2)?.label) : "Selecciona una distracción"}
                </Text>
                <Icon name="alert-circle" size={18} color="#bbb" />
              </TouchableOpacity>

              <Text style={[styles.h1, { marginTop: 18 }]}>
                ¿Cuál es tu objetivo principal al utilizar Focus Up?
              </Text>
              <Text style={styles.label}>Selecciona una opción</Text>
              <TouchableOpacity style={styles.field} onPress={() => openPicker("objective", objectives, "Selecciona una opción")}>
                <Text style={[styles.fieldText, !surveyData.objective && styles.placeholder]}>
                  {surveyData.objective ? (objectives.find(o => o.value === surveyData.objective)?.label) : "Selecciona una opción"}
                </Text>
                <Icon name="target" size={18} color="#bbb" />
              </TouchableOpacity>

              <Text style={[styles.h1, { marginTop: 18 }]}>
                ¿Cuál es tu horario favorito para trabajar?
              </Text>

              <View style={styles.timeRow}>
                <View style={styles.timeCol}>
                  <Text style={styles.label}>Horas</Text>
                  <TouchableOpacity style={styles.field} onPress={() => openPicker("hours", hoursOptions, "Selecciona la hora")}>
                    <Text style={[styles.fieldText, !surveyData.hours && styles.placeholder]}>
                      {surveyData.hours || "HH"}
                    </Text>
                    <Icon name="chevron-down" size={18} color="#bbb" />
                  </TouchableOpacity>
                </View>

                <View style={styles.timeCol}>
                  <Text style={styles.label}>Minutos</Text>
                  <TouchableOpacity style={styles.field} onPress={() => openPicker("minutes", minutesOptions, "Selecciona los minutos")}>
                    <Text style={[styles.fieldText, !surveyData.minutes && styles.placeholder]}>
                      {surveyData.minutes || "MM"}
                    </Text>
                    <Icon name="chevron-down" size={18} color="#bbb" />
                  </TouchableOpacity>
                </View>

                <View style={styles.timeCol}>
                  <Text style={styles.label}>AM/PM</Text>
                  <TouchableOpacity style={styles.field} onPress={() => openPicker("period", periodOptions, "Selecciona AM/PM")}>
                    <Text style={[styles.fieldText, !surveyData.period && styles.placeholder]}>
                      {surveyData.period || "AM/PM"}
                    </Text>
                    <Icon name="chevron-down" size={18} color="#bbb" />
                  </TouchableOpacity>
                </View>
              </View>

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Registrarse</Text>}
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* Pickers */}
      <ModalPicker
        visible={pickerConfig.visible}
        onClose={closePicker}
        options={pickerConfig.options}
        onSelect={handleSelectFromPicker}
        selectedValue={pickerConfig.field ? (surveyData[pickerConfig.field as keyof typeof surveyData] as string) : undefined}
        title={pickerConfig.title}
      />

      <DatePickerModal
        visible={dateModalVisible}
        onClose={() => setDateModalVisible(false)}
        onConfirm={handleDateConfirm}
        initialDate={surveyData.fecha_nacimiento || undefined}
      />
    </LinearGradient>
  );
}

// === Styles (colores fieles al original) ===
const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 28,
    backgroundColor: "#171717",
  },
  backBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 48 : 24,
    left: 16,
    zIndex: 20,
    padding: 6,
  },
  card: {
    backgroundColor: "#232323",
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#333",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  h1: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  label: {
    color: "#cfcfcf",
    fontSize: 13,
    marginTop: 12,
    marginBottom: 6,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  fieldText: {
    color: "#111",
    fontSize: 15,
  },
  placeholder: {
    color: "#888",
  },
  noticeBox: {
    marginTop: 12,
    backgroundColor: "#2b2b2b",
    padding: 10,
    borderRadius: 8,
  },
  noticeText: {
    color: "#ddd",
    fontSize: 13,
    textAlign: "center",
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  timeCol: {
    flex: 1,
    marginHorizontal: 4,
  },
  errorBox: {
    backgroundColor: "#ef4444",
    padding: 10,
    borderRadius: 8,
    marginTop: 14,
  },
  errorText: {
    color: "#fff",
    textAlign: "center",
  },
  submitBtn: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 18,
  },
  submitText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
  },

  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#222",
    borderRadius: 12,
    padding: 14,
    maxHeight: "80%",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  optionItem: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#2b2b2b",
  },
  optionItemSelected: {
    backgroundColor: "#2b2b2b",
  },
  optionText: {
    color: "#ddd",
    textAlign: "center",
  },
  optionTextSelected: {
    color: "#fff",
    fontWeight: "700",
  },
  modalClose: {
    marginTop: 8,
    padding: 10,
    alignSelf: "center",
  },
  modalCloseText: {
    color: "#9aa7b2",
  },

  // Date modal
  dateColumns: { flexDirection: "row", justifyContent: "space-between" },
  dateColumn: { flex: 1, marginHorizontal: 4, maxHeight: 260 },
  dateLabel: { color: "#cfcfcf", textAlign: "center", marginBottom: 6 },
  dateItem: { paddingVertical: 6, alignItems: "center" },
  dateItemSelected: { backgroundColor: "#2b2b2b", borderRadius: 6 },
  dateItemText: { color: "#ddd" },
  dateItemTextSelected: { color: "#fff", fontWeight: "700" },
  modalButtonsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  modalAction: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: "#2b2b2b",
  },
  modalActionPrimary: { backgroundColor: "#2563EB" },
  modalActionText: { color: "#d0d6da" },
  modalActionPrimaryText: { color: "#fff", fontWeight: "700" },
});
