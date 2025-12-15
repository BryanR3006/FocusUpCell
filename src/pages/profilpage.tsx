import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  FlatList,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAuth } from "../contexts/AuthContext"; // Mismo que web
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons, FontAwesome5, Feather } from "@expo/vector-icons";
import { api } from "../clientes/apiClient"; // api en mobile, apiClient en web
import { validateUsername, validateRequired, validateDateOfBirth } from "../utils/validationUtils";
import type { User } from "../types/user";

// Interfaces - SIGUIENDO EL USER TYPE DEL WEB
interface FormData {
  nombre_usuario: string;
  pais: string;
  genero: string;
  fecha_nacimiento: Date;
  hours: string;
  minutes: string;
  period: string;
  distraction1: string;
  distraction2: string;
  objective: string;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Static data - IGUAL QUE WEB
const countries = [
  { label: "Colombia", value: "Colombia" },
  { label: "México", value: "México" },
  { label: "Argentina", value: "Argentina" },
  { label: "Estados Unidos", value: "Estados Unidos" },
  { label: "Canadá", value: "Canadá" },
  { label: "España", value: "España" },
  { label: "Brasil", value: "Brasil" },
  { label: "Chile", value: "Chile" },
  { label: "Perú", value: "Perú" },
  { label: "Alemania", value: "Alemania" },
  { label: "Francia", value: "Francia" },
  { label: "Italia", value: "Italia" },
  { label: "Reino Unido", value: "Reino Unido" },
  { label: "Japón", value: "Japón" },
];

const genders = [
  { label: "Masculino", value: "Masculino" },
  { label: "Femenino", value: "Femenino" },
  { label: "Otro", value: "Otro" },
  { label: "Prefiero no decir", value: "Prefiero no decir" },
];

const hours = Array.from({ length: 12 }, (_, i) => ({
  label: (i + 1).toString().padStart(2, "0"),
  value: (i + 1).toString(),
}));

const minutes = Array.from({ length: 60 }, (_, i) => ({
  label: i.toString().padStart(2, "0"),
  value: i.toString().padStart(2, "0"),
}));

const periods = [
  { label: "AM", value: "AM" },
  { label: "PM", value: "PM" },
];

// Opciones de intereses (objetivos) - IGUAL QUE WEB
const objectives = [
  { value: "1", label: "Estudio y Aprendizaje" },
  { value: "2", label: "Trabajo y Productividad" },
  { value: "3", label: "Tareas Domésticas y Organización Personal" },
  { value: "4", label: "Creatividad y Proyectos Personales" },
  { value: "5", label: "Salud Mental y Bienestar" },
];

// Opciones de distracciones - IGUAL QUE WEB
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

// Modal para selección
interface SelectionModalProps {
  visible: boolean;
  title: string;
  items: Array<{value: string, label: string}>;
  selectedValue: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

const SelectionModal: React.FC<SelectionModalProps> = (props) => {
  const { visible, title, items, selectedValue, onSelect, onClose } = props;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.multiSelectModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={items}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.multiSelectItem}
                onPress={() => {
                  onSelect(item.value);
                  onClose();
                }}
              >
                <Text style={styles.multiSelectItemText}>{item.label}</Text>
                {selectedValue === item.value && (
                  <MaterialIcons name="check" size={20} color="#8B5CF6" />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
};

export const ProfileScreen: React.FC = () => {
  // MISMO HOOK QUE WEB
  const { user, loading: authLoading, updateUser, logout } = useAuth();
  const navigation = useNavigation();

  // MISMO ESTADO INICIAL QUE WEB
  const [formData, setFormData] = useState<FormData>({
    nombre_usuario: "",
    pais: "",
    genero: "",
    fecha_nacimiento: new Date(),
    hours: "",
    minutes: "",
    period: "",
    distraction1: "",
    distraction2: "",
    objective: "",
  });

  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [showDistraction1Modal, setShowDistraction1Modal] = useState(false);
  const [showDistraction2Modal, setShowDistraction2Modal] = useState(false);
  const [showObjectiveModal, setShowObjectiveModal] = useState(false);

  // Cargar datos - SIMPLIFICADO COMO WEB
  useEffect(() => {
    if (!user) return;

    console.log("Usuario del AuthContext:", user);

    // Convertir horario_fav de formato HH:MM:SS a componentes separados si existe
    let hours = "", minutes = "", period = "";
    if (user.horario_fav) {
      console.log("Horario_fav encontrado:", user.horario_fav);
      const [timePart] = user.horario_fav.split(' '); // Remover segundos si existen
      const [hourStr, minuteStr] = timePart.split(':');
      const hour = parseInt(hourStr);
      hours = (hour === 0 ? 12 : hour > 12 ? hour - 12 : hour).toString().padStart(2, '0');
      minutes = minuteStr;
      period = hour >= 12 ? "PM" : "AM";
      console.log("Horario procesado:", { hours, minutes, period });
    }

    // Asegurar que fecha_nacimiento sea un objeto Date válido
    let fechaNacimiento: Date;
    if (user.fecha_nacimiento) {
      if (user.fecha_nacimiento instanceof Date) {
        fechaNacimiento = user.fecha_nacimiento;
      } else if (typeof user.fecha_nacimiento === 'string') {
        // Convertir string de fecha a objeto Date
        const parsedDate = new Date(user.fecha_nacimiento);
        fechaNacimiento = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
      } else {
        fechaNacimiento = new Date();
      }
    } else {
      fechaNacimiento = new Date();
    }

    // Convertir distracciones array a campos individuales para los dropdowns
    const distracciones = user.distracciones || [];
    const distraction1 = distracciones.length > 0 ? distracciones[0].toString() : "";
    const distraction2 = distracciones.length > 1 ? distracciones[1].toString() : "";

    // Intereses/objetivo
    const intereses = user.intereses || [];
    const objective = intereses.length > 0 ? intereses[0].toString() : "";

    setFormData({
      nombre_usuario: user.nombre_usuario || "",
      pais: user.pais || "",
      genero: user.genero || "",
      fecha_nacimiento: fechaNacimiento,
      hours,
      minutes,
      period,
      distraction1,
      distraction2,
      objective,
    });

  }, [user]);

  const handleChange = (field: keyof FormData, value: string | Date) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field: keyof PasswordData, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
  };

  const formatDateForAPI = (date: Date): string => {
    // MISMO QUE WEB: YYYY-MM-DD
    return date.toISOString().split('T')[0];
  };

  // FUNCIÓN PRINCIPAL - COPIADA DEL WEB CON AJUSTES PARA REACT NATIVE
  const handleUpdateProfile = async () => {
    if (!user?.id_usuario) {
      Alert.alert("Error", "Usuario no identificado");
      return;
    }

    setLoading(true);

    try {
      // Validar fecha de nacimiento (igual que web)
      const dateError = validateDateOfBirth(formatDateForAPI(formData.fecha_nacimiento));
      if (dateError) {
        Alert.alert("Fecha de nacimiento inválida", dateError);
        return;
      }

      // Validar nombre de usuario si cambió (igual que web pero simplificado)
      if (formData.nombre_usuario !== user.nombre_usuario) {
        const formatError = validateUsername(formData.nombre_usuario);
        if (formatError) {
          Alert.alert("Nombre de usuario inválido", formatError);
          return;
        }
      }

      // Validar contraseña si se está cambiando
      if (showPasswordFields) {
        if (!passwordData.currentPassword || !passwordData.newPassword) {
          Alert.alert("Campos incompletos", "Por favor complete todos los campos de contraseña");
          return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
          Alert.alert("Contraseñas no coinciden", "Las nuevas contraseñas no coinciden");
          return;
        }

        // Validación básica de contraseña
        if (passwordData.newPassword.length < 6) {
          Alert.alert("Contraseña muy corta", "La contraseña debe tener al menos 6 caracteres");
          return;
        }
      }

      // Convertir componentes de tiempo a formato HH:MM (IGUAL QUE WEB)
      let horarioFav: string | null = null;
      if (formData.hours && formData.minutes && formData.period) {
        const hours24 = formData.period === "PM" && formData.hours !== "12" 
          ? parseInt(formData.hours) + 12 
          : formData.period === "AM" && formData.hours === "12" 
            ? 0 
            : parseInt(formData.hours);
        horarioFav = `${hours24.toString().padStart(2, '0')}:${formData.minutes.padStart(2, '0')}`;
        console.log("Horario fav calculado:", horarioFav);
      }

      // Convertir campos de formulario al formato esperado por la API (IGUAL QUE WEB)
      const distracciones = [
        formData.distraction1 ? parseInt(formData.distraction1) : null,
        formData.distraction2 ? parseInt(formData.distraction2) : null
      ].filter((id): id is number => id !== null && !isNaN(id));

      const updateData: Record<string, unknown> = {
        nombre_usuario: formData.nombre_usuario,
        pais: formData.pais,
        genero: formData.genero,
        fecha_nacimiento: formatDateForAPI(formData.fecha_nacimiento), // YYYY-MM-DD
        horario_fav: horarioFav,
        intereses: formData.objective ? [parseInt(formData.objective)] : [],
        distracciones: distracciones,
      };

      // If password change is requested, include it (IGUAL QUE WEB)
      if (showPasswordFields) {
        updateData.currentPassword = passwordData.currentPassword;
        updateData.newPassword = passwordData.newPassword;
      }

      console.log("Enviando datos:", updateData);

      // En mobile usamos 'api', en web usan 'apiClient'
      // Endpoint igual que web: /users/{id}
      await api.put(`/users/${user.id_usuario}`, updateData);

      // Actualizar los datos del usuario en el contexto de autenticación (IGUAL QUE WEB)
      if (updateUser) {
        const updatedUserData = {
          nombre_usuario: formData.nombre_usuario,
          pais: formData.pais,
          genero: formData.genero,
          fecha_nacimiento: formData.fecha_nacimiento,
          horario_fav: horarioFav || undefined,
          intereses: formData.objective ? [parseInt(formData.objective)] : [],
          distracciones: distracciones,
        };
        updateUser(updatedUserData);
      }

      Alert.alert("¡Perfil actualizado!", "Los cambios en tu perfil han sido guardados correctamente.");

      // Reset password fields (IGUAL QUE WEB)
      if (showPasswordFields) {
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setShowPasswordFields(false);
      }

    } catch (error: any) {
      console.error("Error al actualizar perfil:", error);

      let errorMessage = "Error al actualizar perfil";
      
      // Manejo de errores específicos
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 400) {
          errorMessage = data?.message || "Datos inválidos. Revisa los campos.";
        } else if (status === 409) {
          errorMessage = "El nombre de usuario ya está en uso";
        } else if (status === 401) {
          errorMessage = "Sesión expirada. Por favor inicia sesión nuevamente";
        } else {
          errorMessage = data?.message || `Error ${status}: ${data?.error || "Error desconocido"}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert("Error al actualizar", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    // Esta función ahora está integrada en handleUpdateProfile
    // (igual que en web, manejan el cambio de contraseña en el mismo submit)
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = async () => {
    if (!user?.id_usuario) {
      setShowDeleteModal(false);
      return;
    }

    setDeleteLoading(true);
    try {
      // IGUAL QUE WEB: /users/{id}
      await api.delete(`/users/${user.id_usuario}`);

      Alert.alert(
        "Cuenta eliminada",
        "Tu cuenta ha sido eliminada exitosamente",
        [
          {
            text: "OK",
            onPress: () => {
              if (logout) logout();
              navigation.navigate("Login" as never);
            },
          },
        ]
      );

    } catch (error: any) {
      console.error("Error eliminando cuenta:", error);
      Alert.alert("Error", "No se pudo eliminar la cuenta. Intenta nuevamente.");
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFormData((prev) => ({ ...prev, fecha_nacimiento: selectedDate }));
    }
  };

  // Funciones helper
  const getDistractionLabel = (value: string) => {
    if (!value) return "Seleccionar distracción";
    const distraction = distractions.find(d => d.value === value);
    return distraction ? distraction.label : "Seleccionar distracción";
  };

  const getObjectiveLabel = (value: string) => {
    if (!value) return "Seleccionar objetivo";
    const objective = objectives.find(o => o.value === value);
    return objective ? objective.label : "Seleccionar objetivo";
  };

  if (authLoading || !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  // El JSX se mantiene igual que antes...
  // Solo necesitas asegurarte de que los Picker tengan las keys correctas

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#070812" />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Ajustes de Perfil</Text>

          <View style={styles.formContainer}>
            {/* Nombre de usuario */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre de usuario</Text>
              <View style={styles.inputContainer}>
                <FontAwesome5 name="user" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.nombre_usuario}
                  onChangeText={(value) => handleChange("nombre_usuario", value)}
                  placeholder="Nombre de usuario"
                  placeholderTextColor="#9CA3AF"
                  editable={!loading}
                />
              </View>
            </View>

            {/* País */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>País</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.pais}
                  onValueChange={(value) => handleChange("pais", value)}
                  style={styles.picker}
                  enabled={!loading}
                >
                  <Picker.Item label="Selecciona un país" value="" />
                  {countries.map((country) => (
                    <Picker.Item 
                      key={country.value} 
                      label={country.label} 
                      value={country.value} 
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Género */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Género</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.genero}
                  onValueChange={(value) => handleChange("genero", value)}
                  style={styles.picker}
                  enabled={!loading}
                >
                  <Picker.Item label="Seleccionar género" value="" />
                  {genders.map((gender) => (
                    <Picker.Item 
                      key={gender.value} 
                      label={gender.label} 
                      value={gender.value} 
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Horario favorito */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Horario favorito para trabajar</Text>
              <View style={styles.timeContainer}>
                <View style={styles.timeInputGroup}>
                  <Text style={styles.timeLabel}>Horas</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={formData.hours}
                      onValueChange={(value) => handleChange("hours", value)}
                      style={styles.timePicker}
                      enabled={!loading}
                    >
                      <Picker.Item label="HH" value="" />
                      {hours.map((hour) => (
                        <Picker.Item 
                          key={hour.value} 
                          label={hour.label} 
                          value={hour.value} 
                        />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={styles.timeInputGroup}>
                  <Text style={styles.timeLabel}>Minutos</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={formData.minutes}
                      onValueChange={(value) => handleChange("minutes", value)}
                      style={styles.timePicker}
                      enabled={!loading}
                    >
                      <Picker.Item label="MM" value="" />
                      {minutes.map((minute) => (
                        <Picker.Item 
                          key={minute.value} 
                          label={minute.label} 
                          value={minute.value} 
                        />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={styles.timeInputGroup}>
                  <Text style={styles.timeLabel}>AM/PM</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={formData.period}
                      onValueChange={(value) => handleChange("period", value)}
                      style={styles.timePicker}
                      enabled={!loading}
                    >
                      <Picker.Item label="AM/PM" value="" />
                      {periods.map((period) => (
                        <Picker.Item 
                          key={period.value} 
                          label={period.label} 
                          value={period.value} 
                        />
                      ))}
                    </Picker>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.separator} />

            {/* Fecha de nacimiento */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Fecha de nacimiento</Text>
              <TouchableOpacity
                style={styles.inputContainer}
                onPress={() => setShowDatePicker(true)}
                disabled={loading}
              >
                <FontAwesome5 name="calendar" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <Text style={styles.dateText}>
                  {formData.fecha_nacimiento.toLocaleDateString('es-ES')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Distracciones más comunes */}
            <View style={styles.inputGroup}>
              <Text style={styles.sectionTitle}>
                ¿Cuáles son tus 2 distracciones más comunes?
              </Text>
              
              <View style={styles.distractionContainer}>
                <View style={styles.distractionInputGroup}>
                  <Text style={styles.label}>Primera distracción</Text>
                  <TouchableOpacity
                    style={styles.selectionButton}
                    onPress={() => setShowDistraction1Modal(true)}
                    disabled={loading}
                  >
                    <Text style={styles.selectionButtonText}>
                      {getDistractionLabel(formData.distraction1)}
                    </Text>
                    <MaterialIcons name="arrow-drop-down" size={24} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>

                <View style={styles.distractionInputGroup}>
                  <Text style={styles.label}>Segunda distracción</Text>
                  <TouchableOpacity
                    style={styles.selectionButton}
                    onPress={() => setShowDistraction2Modal(true)}
                    disabled={loading}
                  >
                    <Text style={styles.selectionButtonText}>
                      {getDistractionLabel(formData.distraction2)}
                    </Text>
                    <MaterialIcons name="arrow-drop-down" size={24} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Objetivo principal */}
            <View style={styles.inputGroup}>
              <Text style={styles.sectionTitle}>
                ¿Cuál es tu objetivo principal al utilizar Focus Up?
              </Text>
              <TouchableOpacity
                style={styles.selectionButton}
                onPress={() => setShowObjectiveModal(true)}
                disabled={loading}
              >
                <Text style={styles.selectionButtonText}>
                  {getObjectiveLabel(formData.objective)}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <View style={styles.separator} />

            {/* Cambiar contraseña */}
            <View style={styles.inputGroup}>
              {!showPasswordFields ? (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => setShowPasswordFields(true)}
                  disabled={loading}
                >
                  <MaterialIcons name="lock" size={20} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Cambiar contraseña</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.passwordContainer}>
                  <Text style={styles.sectionTitle}>Cambiar contraseña</Text>

                  <View style={styles.passwordInputGroup}>
                    <Text style={styles.label}>Contraseña actual</Text>
                    <View style={styles.inputContainer}>
                      <MaterialIcons name="lock" size={20} color="#9CA3AF" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        secureTextEntry={!showCurrentPassword}
                        value={passwordData.currentPassword}
                        onChangeText={(value) => handlePasswordChange("currentPassword", value)}
                        placeholder="Contraseña actual"
                        placeholderTextColor="#9CA3AF"
                        editable={!loading}
                      />
                      <TouchableOpacity
                        onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                        style={styles.eyeButton}
                      >
                        {showCurrentPassword ? (
                          <Feather name="eye-off" size={20} color="#9CA3AF" />
                        ) : (
                          <Feather name="eye" size={20} color="#9CA3AF" />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.passwordInputGroup}>
                    <Text style={styles.label}>Nueva contraseña</Text>
                    <View style={styles.inputContainer}>
                      <MaterialIcons name="lock-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        secureTextEntry={!showNewPassword}
                        value={passwordData.newPassword}
                        onChangeText={(value) => handlePasswordChange("newPassword", value)}
                        placeholder="Nueva contraseña"
                        placeholderTextColor="#9CA3AF"
                        editable={!loading}
                      />
                      <TouchableOpacity
                        onPress={() => setShowNewPassword(!showNewPassword)}
                        style={styles.eyeButton}
                      >
                        {showNewPassword ? (
                          <Feather name="eye-off" size={20} color="#9CA3AF" />
                        ) : (
                          <Feather name="eye" size={20} color="#9CA3AF" />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.passwordInputGroup}>
                    <Text style={styles.label}>Confirmar nueva contraseña</Text>
                    <View style={styles.inputContainer}>
                      <MaterialIcons name="lock-reset" size={20} color="#9CA3AF" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        secureTextEntry={!showConfirmPassword}
                        value={passwordData.confirmPassword}
                        onChangeText={(value) => handlePasswordChange("confirmPassword", value)}
                        placeholder="Confirmar nueva contraseña"
                        placeholderTextColor="#9CA3AF"
                        editable={!loading}
                      />
                      <TouchableOpacity
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={styles.eyeButton}
                      >
                        {showConfirmPassword ? (
                          <Feather name="eye-off" size={20} color="#9CA3AF" />
                        ) : (
                          <Feather name="eye" size={20} color="#9CA3AF" />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.passwordButtons}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => {
                        setShowPasswordFields(false);
                        setPasswordData({
                          currentPassword: "",
                          newPassword: "",
                          confirmPassword: "",
                        });
                      }}
                      disabled={loading}
                    >
                      <Text style={styles.cancelButtonText}>Cancelar cambio</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.separator} />

            {/* Eliminar cuenta */}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDeleteAccount}
              disabled={loading}
            >
              <MaterialIcons name="delete" size={20} color="#FFFFFF" />
              <Text style={styles.deleteButtonText}>Eliminar cuenta</Text>
            </TouchableOpacity>

            {/* Botones de acción */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.disabledButton]}
                onPress={handleUpdateProfile}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Guardar Cambios</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => navigation.goBack()}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modales de selección */}
      <SelectionModal
        visible={showDistraction1Modal}
        title="Seleccionar primera distracción"
        items={distractions}
        selectedValue={formData.distraction1}
        onSelect={(value) => handleChange("distraction1", value)}
        onClose={() => setShowDistraction1Modal(false)}
      />

      <SelectionModal
        visible={showDistraction2Modal}
        title="Seleccionar segunda distracción"
        items={distractions}
        selectedValue={formData.distraction2}
        onSelect={(value) => handleChange("distraction2", value)}
        onClose={() => setShowDistraction2Modal(false)}
      />

      <SelectionModal
        visible={showObjectiveModal}
        title="Seleccionar objetivo principal"
        items={objectives}
        selectedValue={formData.objective}
        onSelect={(value) => handleChange("objective", value)}
        onClose={() => setShowObjectiveModal(false)}
      />

      {/* Modal de eliminación de cuenta */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Eliminar Cuenta</Text>
              <TouchableOpacity onPress={() => setShowDeleteModal(false)}>
                <MaterialIcons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalText}>
              ¿Estás seguro de que quieres eliminar tu cuenta y todos tus datos asociados? Esta acción no se puede deshacer.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalDeleteButton}
                onPress={confirmDeleteAccount}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalDeleteText}>Eliminar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.fecha_nacimiento}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={new Date()}
          minimumDate={new Date(1900, 0, 1)}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#070812",
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#070812",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFFFFF",
    marginTop: 16,
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 24,
  },
  formContainer: {
    backgroundColor: "rgba(11, 16, 32, 0.95)",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.3)",
  },
  inputGroup: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#9CA3AF",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0B1020",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#374151",
    paddingHorizontal: 12,
    minHeight: 50,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#FFFFFF",
    paddingVertical: 12,
  },
  eyeButton: {
    padding: 4,
  },
  pickerContainer: {
    backgroundColor: "#0B1020",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#374151",
    minHeight: 50,
    justifyContent: "center",
  },
  picker: {
    color: "#FFFFFF",
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  timeInputGroup: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#9CA3AF",
    marginBottom: 8,
  },
  timePicker: {
    color: "#FFFFFF",
  },
  separator: {
    height: 1,
    backgroundColor: "#374151",
    marginVertical: 24,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: "#FFFFFF",
    paddingVertical: 12,
  },
  distractionContainer: {
    gap: 16,
  },
  distractionInputGroup: {
    gap: 8,
  },
  selectionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0B1020",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#374151",
    paddingHorizontal: 12,
    minHeight: 50,
  },
  selectionButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  passwordContainer: {
    gap: 16,
  },
  passwordInputGroup: {
    gap: 8,
  },
  passwordButtons: {
    flexDirection: "row",
    gap: 12,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#8B5CF6",
    borderRadius: 12,
    padding: 16,
    minHeight: 50,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#10B981",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  secondaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#DC2626",
    borderRadius: 12,
    padding: 16,
    minHeight: 50,
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  submitButton: {
    flex: 1,
    backgroundColor: "#8B5CF6",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  disabledButton: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#4B5563",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#0B1020",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 400,
  },
  multiSelectModalContent: {
    backgroundColor: "#0B1020",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  modalText: {
    fontSize: 16,
    color: "#D1D5DB",
    marginBottom: 24,
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: "#4B5563",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  modalCancelText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  modalDeleteButton: {
    flex: 1,
    backgroundColor: "#DC2626",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  modalDeleteText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  multiSelectItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  multiSelectItemText: {
    fontSize: 16,
    color: "#D1D5DB",
  },
});

export default ProfileScreen;