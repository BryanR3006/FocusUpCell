// StudyMethodsLibraryPage.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { useAuth } from "../contexts/AuthContext";
import { Sidebar } from "../ui/Sidebar"; // Asegúrate de que la ruta sea correcta
import { StudyMethod, Benefit } from "../types/studyMethod";

/* ICONS: uso emojis para que no dependas de libs externas; si prefieres lucide-react-native,
    reemplaza los emojis por los componentes icon. */

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const COLOR_FALLBACKS = [
  "#F43F5E", // rojo (pomodoro)
  "#10B981", // verde (mapas)
  "#8B5CF6", // morado (repaso)
  "#FBBF24", // amarillo (feynman)
  "#3B82F6", // azul (cornell)
];

const exampleMethods: StudyMethod[] = [
  {
    id_metodo: 1,
    nombre_metodo: "Método Pomodoro",
    descripcion:
      "Técnica de gestion de tiempo. Divide el tiempo de estudio en intervalos de trabajo y descanso",
    beneficios: [
      { id_beneficio: 1, descripcion_beneficio: "Aumenta la concentración" },
      { id_beneficio: 2, descripcion_beneficio: "Reduce la fatiga mental" },
      { id_beneficio: 3, descripcion_beneficio: "Optimiza el tiempo de estudio" },
      { id_beneficio: 4, descripcion_beneficio: "Mejora la organización" },
    ],
    icon: "🍅",
    color_hexa: "#EF4444",
  },
  {
    id_metodo: 2,
    nombre_metodo: "Mapas Mentales",
    descripcion:
      "Organiza visualmente las ideas. Crea mapas mentales para conectar ideas clave.",
    beneficios: [
      { id_beneficio: 5, descripcion_beneficio: "Facilita el aprendizaje significativo" },
      { id_beneficio: 6, descripcion_beneficio: "Ayuda a visualizar conceptos" },
      { id_beneficio: 7, descripcion_beneficio: "Fomenta la creatividad" },
      { id_beneficio: 8, descripcion_beneficio: "Fortalece la memoria" },
      { id_beneficio: 9, descripcion_beneficio: "Mejora la comunicación" },
    ],
    icon: "💡",
    color_hexa: "#10B981",
  },
  {
    id_metodo: 3,
    nombre_metodo: "Repaso Espaciado",
    descripcion: "Reforzamiento a largo plazo. Revisa la información en intervalos regulares.",
    beneficios: [
      { id_beneficio: 10, descripcion_beneficio: "Mejora la retención a largo plazo" },
      { id_beneficio: 11, descripcion_beneficio: "Evita el olvido rápido" },
      { id_beneficio: 12, descripcion_beneficio: "Fortalece la memoria" },
    ],
    icon: "📅",
    color_hexa: "#7C3AED",
  },
  {
    id_metodo: 4,
    nombre_metodo: "Práctica Activa",
    descripcion:
      "Aprende haciendo. Pon a prueba tu conocimiento respondiendo preguntas o resolviendo problemas.",
    beneficios: [
      { id_beneficio: 13, descripcion_beneficio: "Facilita el aprendizaje significativo" },
      { id_beneficio: 14, descripcion_beneficio: "Mejora la retención a largo plazo" },
      { id_beneficio: 15, descripcion_beneficio: "Desarrolla habilidades prácticas" },
    ],
    icon: "🧩",
    color_hexa: "#059669",
  },
  {
    id_metodo: 5,
    nombre_metodo: "Método Feynman",
    descripcion:
      "Aprender explicando. Intenta explicar el tema como si se lo enseñaras a alguien más.",
    beneficios: [
      { id_beneficio: 16, descripcion_beneficio: "Profundiza la comprensión" },
      { id_beneficio: 17, descripcion_beneficio: "Identifica lagunas en la comprensión" },
      { id_beneficio: 18, descripcion_beneficio: "Mejora la comunicación" },
    ],
    icon: "🧠",
    color_hexa: "#F59E0B",
  },
  {
    id_metodo: 6,
    nombre_metodo: "Método Cornell",
    descripcion: "Notas efectivas. Toma notas de manera estructurada para facilitar el repaso.",
    beneficios: [
      { id_beneficio: 19, descripcion_beneficio: "Mejora la organización" },
      { id_beneficio: 20, descripcion_beneficio: "Facilita el repaso" },
      { id_beneficio: 21, descripcion_beneficio: "Aumenta la claridad al estudiar" },
    ],
    icon: "📘",
    color_hexa: "#2563EB",
  },
];

export const StudyMethodsLibraryPage: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { isAuthenticated } = useAuth(); // si no usas este contexto, elimina
  const [methods, setMethods] = useState<StudyMethod[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [sidebarVisible, setSidebarVisible] = useState(false);

  // Animación de aparición de lista
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // temporal: carga de ejemplo; reemplaza con fetch real
    const load = async () => {
      try {
        setLoading(true);
        // ejemplo: verifica token (si usas autenticación real)
        const token = await AsyncStorage.getItem("token");
        // si necesitas redirigir cuando no hay token:
        if (!token && isAuthenticated === false) {
          navigation.navigate("Login");
          return;
        }

        // Si tienes backend, pide aquí y setea setMethods(response)
        setMethods(exampleMethods);
        setTimeout(() => {
          Animated.timing(fade, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }).start();
        }, 120);
      } catch (err) {
        console.error(err);
        setError("Error al cargar métodos. Intenta de nuevo.");
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -----------------------------------------
  // Aquí está la implementación actualizada:
  // Navega a PomodoroIntro y además pasa "method" como parámetro.
  // Asegúrate de que tu RootStackParamList declare PomodoroIntro
  // (por ejemplo: PomodoroIntro: { methodId: number } )
  // -----------------------------------------
  const handleViewStepByStep = (method: StudyMethod) => {
    const name = method.nombre_metodo.toLowerCase();

    if (name.includes("pomodoro")) {
      // Navega a PomodoroIntro y pasa el método completo (útil para evitar otro fetch)
      navigation.navigate("PomodoroIntro", { methodId: method.id_metodo, method });
      return;
    }

    // Otros mapeos por nombre (si los tienes)
    if (name.includes("mapa") || name.includes("mentales")) {
      navigation.navigate("MindMapsIntro", { methodId: method.id_metodo });
      return;
    }

    if (name.includes("repaso") && name.includes("espaciado")) {
      navigation.navigate("SpacedRepetitionIntro", { methodId: method.id_metodo });
      return;
    }

    if (name.includes("práctica") && name.includes("activa")) {
      navigation.navigate("ActiveRecallIntro", { methodId: method.id_metodo });
      return;
    }

    if (name.includes("feynman")) {
      navigation.navigate("FeynmanIntro", { methodId: method.id_metodo });
      return;
    }

    if (name.includes("cornell")) {
      navigation.navigate("CornellIntro", { methodId: method.id_metodo });
      return;
    }

    // Fallback: pantalla genérica de pasos del método
    navigation.navigate("MethodSteps", { methodId: method.id_metodo });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0b0b0b" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Cargando métodos de estudio...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0b0b0b" />
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Error al cargar datos</Text>
          <Text style={styles.errorMsg}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); setError(""); setMethods(exampleMethods); setLoading(false); }}>
            <Text style={styles.retryText}>Intentar de nuevo</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0b0b0b" />

      {/* Header con botón de menú */}
      <View style={styles.headerWithMenu}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setSidebarVisible(true)}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Biblioteca</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Biblioteca de{"\n"}Métodos de Estudio</Text>
          <Text style={styles.subtitle}>
            Descubre técnicas probadas científicamente para potenciar tu concentración, mejorar la retención de información y optimizar tu tiempo de estudio
          </Text>

          <View style={styles.tagsRow}>
            <View style={[styles.tag, { borderColor: "rgba(59,130,246,0.18)" }]}>
              <View style={[styles.tagDot, { backgroundColor: "#2563EB" }]} />
              <Text style={styles.tagText}>Técnicas Probadas</Text>
            </View>
            <View style={[styles.tag, { borderColor: "rgba(139,92,246,0.12)" }]}>
              <View style={[styles.tagDot, { backgroundColor: "#8B5CF6" }]} />
              <Text style={styles.tagText}>Mejor Concentración</Text>
            </View>
            <View style={[styles.tag, { borderColor: "rgba(99,102,241,0.12)" }]}>
              <View style={[styles.tagDot, { backgroundColor: "#6366F1" }]} />
              <Text style={styles.tagText}>Resultados Garantizados</Text>
            </View>
          </View>
        </View>

        <Animated.View style={{ opacity: fade }}>
          {methods.map((m) => (
            <MethodCard
              key={m.id_metodo}
              method={m}
              onView={() => handleViewStepByStep(m)}
            />
          ))}
        </Animated.View>
      </ScrollView>

      {/* Sidebar Modal */}
      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        currentPage="study-methods"
      />
    </SafeAreaView>
  );
};

/* ---------------------------
   Card component (estilo como en las images)
   Ahora la tarjeta completa es touchable para abrir la vista paso a paso.
   --------------------------- */
const MethodCard: React.FC<{ method: StudyMethod; onView: () => void }> = ({ method, onView }) => {
  const color = method.color_hexa || COLOR_FALLBACKS[(method.id_metodo - 1) % COLOR_FALLBACKS.length];
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onView} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconCircle, { borderColor: `${color}22` }]}>
          <Text style={[styles.iconEmoji, { backgroundColor: "transparent" }]}>{method.icon || "📚"}</Text>
        </View>
        <Text style={[styles.cardTitle, { color }]}>{method.nombre_metodo}</Text>
      </View>

      <Text style={styles.cardDesc}>{method.descripcion}</Text>

      <View style={styles.divider} />

      <Text style={styles.benefitsTitle}>Beneficios</Text>
      <View style={styles.benefitsList}>
        {method.beneficios.map((b: Benefit) => (
          <View key={b.id_beneficio} style={styles.benefitItem}>
            <View style={styles.bullet} />
            <Text style={styles.benefitText}>{b.descripcion_beneficio}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={[styles.ctaButton, { backgroundColor: color }]} onPress={onView}>
        <Text style={styles.ctaText}>Ver guía paso a paso</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

/* ---------------------------
   Styles
   --------------------------- */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0b0b0b",
  },
  headerWithMenu: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#0f0f10",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  headerSpacer: {
    width: 40, // Para mantener la simetría
  },
  screenContent: {
    padding: 18,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 12,
    alignItems: "center",
  },
  title: {
    color: "#E6EEF8",
    fontSize: 34,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 40,
    marginTop: 6,
  },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 14,
    textAlign: "center",
    marginTop: 12,
    maxWidth: 860,
    lineHeight: 20,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 14,
    justifyContent: "center",
    gap: 8,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    marginHorizontal: 6,
    marginVertical: 6,
  },
  tagDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  tagText: {
    color: "#C7D2FE",
    fontWeight: "600",
    fontSize: 13,
  },

  /* Card */
  card: {
    backgroundColor: "#0f0f10",
    marginTop: 16,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.03)",
    elevation: 6,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  iconEmoji: {
    fontSize: 18,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  cardDesc: {
    color: "#9CA3AF",
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(148,163,184,0.06)",
    marginVertical: 10,
  },
  benefitsTitle: {
    color: "#cbd5e1",
    fontWeight: "700",
    marginBottom: 8,
  },
  benefitsList: {
    marginBottom: 14,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#9CA3AF",
    marginTop: 8,
    marginRight: 10,
  },
  benefitText: {
    color: "#cbd5e1",
    fontSize: 14,
    flex: 1,
  },

  ctaButton: {
    marginTop: 6,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 15,
  },

  /* Centered states */
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 14,
    color: "#cbd5e1",
    fontSize: 15,
  },
  errorTitle: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 18,
    marginBottom: 8,
  },
  errorMsg: {
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: {
    color: "#fff",
    fontWeight: "700",
  },
});

export default StudyMethodsLibraryPage;
