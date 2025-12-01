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
import { useAuth } from "../contexts/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons, FontAwesome5, Feather, Ionicons, AntDesign } from "@expo/vector-icons";
import { apiClient } from "../clientes/apiClient";
import { validateUsername, validateRequired, validateDateOfBirth } from "../utils/validationUtils";

// Interfaces
interface UserProfile {
  id_usuario?: string;
  nombre_usuario: string;
  email?: string;
  pais: string;
  genero: string;
  fecha_nacimiento: string;
  horario_fav?: string;
  intereses?: number[];
  distracciones?: number[];
}

interface Interest {
  id: number;
  nombre: string;
}

interface Distraction {
  id: number;
  nombre: string;
}

interface FormData {
  nombre_usuario: string;
  pais: string;
  genero: string;
  fecha_nacimiento: Date;
  hours: string;
  minutes: string;
  period: string;
  intereses: number[];
  distracciones: number[];
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Static data
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
  value: i.toString(),
}));

const periods = [
  { label: "AM", value: "AM" },
  { label: "PM", value: "PM" },
];

// Multi-select modal component
interface MultiSelectModalProps {
  visible: boolean;
  title: string;
  items: { id: number; nombre: string }[];
  selected: number[];
  onSelect: (selected: number[]) => void;
  onClose: () => void;
  maxSelect?: number;
}

interface ChipProps {
  label: string;
  onRemove: () => void;
}

const MultiSelectModal: React.FC<MultiSelectModalProps> = (props) => {
  const { visible, title, items, selected, onSelect, onClose, maxSelect } = props;
  const [tempSelected, setTempSelected] = useState<number[]>(selected);

  useEffect(() => {
    setTempSelected(selected);
  }, [selected, visible]);

  const toggleItem = (id: number) => {
    if (tempSelected.includes(id)) {
      setTempSelected(tempSelected.filter(item => item !== id));
    } else {
      if (maxSelect && tempSelected.length >= maxSelect) {
        Alert.alert("Límite alcanzado", `Puedes seleccionar máximo ${maxSelect} elementos.`);
        return;
      }
      setTempSelected([...tempSelected, id]);
    }
  };

  const handleConfirm = () => {
    onSelect(tempSelected);
    onClose();
  };

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
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.multiSelectItem}
                onPress={() => toggleItem(item.id)}
              >
                <Text style={styles.multiSelectItemText}>{item.nombre}</Text>
                <View style={styles.checkbox}>
                  {tempSelected.includes(item.id) && (
                    <MaterialIcons name="check" size={20} color="#8B5CF6" />
                  )}
                </View>
              </TouchableOpacity>
            )}
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.modalCancelButton} onPress={onClose}>
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalConfirmButton} onPress={handleConfirm}>
              <Text style={styles.modalConfirmText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Chip component
interface ChipProps {
  label: string;
  onRemove: () => void;
}

const Chip: React.FC<ChipProps> = (props: ChipProps) => {
  const { label, onRemove } = props;
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
      <TouchableOpacity onPress={onRemove}>
        <MaterialIcons name="close" size={16} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

export const ProfileScreen: React.FC = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const navigation = useNavigation();

  const [formData, setFormData] = useState<FormData>({
    nombre_usuario: "",
    pais: "",
    genero: "",
    fecha_nacimiento: new Date(),
    hours: "",
    minutes: "",
    period: "",
    intereses: [],
    distracciones: [],
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
  const [showInterestsModal, setShowInterestsModal] = useState(false);
  const [showDistractionsModal, setShowDistractionsModal] = useState(false);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [distractions, setDistractions] = useState<Distraction[]>([]);

  // Load profile data
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const [profileRes, interestsRes, distractionsRes] = await Promise.all([
          apiClient.getUserProfile(),
          apiClient.getInterests(),
          apiClient.getDistractions(),
        ]);

        const profileData = profileRes.data;

        // Process time
        let hours = "", minutes = "", period = "";
        if (profileData.horario_fav) {
          const timeMatch = profileData.horario_fav.match(/(\d{1,2}):(\d{2})/);
          if (timeMatch) {
            let hour = parseInt(timeMatch[1]);
            minutes = timeMatch[2];

            if (hour >= 12) {
              period = "PM";
              if (hour > 12) hour -= 12;
            } else {
              period = "AM";
              if (hour === 0) hour = 12;
            }
            hours = hour.toString().padStart(2, "0");
          }
        }

        // Process birth date
        let fechaNacimiento = new Date();
        if (profileData.fecha_nacimiento) {
          const date = new Date(profileData.fecha_nacimiento);
          if (!isNaN(date.getTime())) {
            fechaNacimiento = date;
          }
        }

        setFormData({
          nombre_usuario: profileData.nombre_usuario || "",
          pais: profileData.pais || "",
          genero: profileData.genero || "",
          fecha_nacimiento: fechaNacimiento,
          hours,
          minutes,
          period,
          intereses: profileData.intereses || [],
          distracciones: profileData.distracciones || [],
        });

        setInterests(interestsRes.data || []);
        setDistractions(distractionsRes.data || []);
      } catch (error) {
        console.error("Error loading data:", error);
        Alert.alert("Error", "No se pudo cargar la información");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleChange = (field: keyof FormData, value: string | number[] | Date) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field: keyof PasswordData, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
  };

  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleUpdateProfile = async () => {
    if (!user?.id_usuario) {
      Alert.alert("Error", "Usuario no identificado");
      return;
    }

    // Validations
    if (!validateRequired(formData.nombre_usuario)) {
      Alert.alert("Error", "El nombre de usuario es requerido");
      return;
    }

    if (!validateUsername(formData.nombre_usuario)) {
      Alert.alert("Error", "El nombre de usuario debe tener entre 3 y 20 caracteres alfanuméricos");
      return;
    }

    if (!formData.fecha_nacimiento) {
      Alert.alert("Error", "La fecha de nacimiento es requerida");
      return;
    }

    if (!validateDateOfBirth(formatDateForAPI(formData.fecha_nacimiento))) {
      Alert.alert("Error", "Fecha de nacimiento inválida");
      return;
    }

    setLoading(true);

    try {
      // Convert time to 24h
      let horario_fav = "";
      if (formData.hours && formData.minutes && formData.period) {
        let hour24 = parseInt(formData.hours);

        if (formData.period === "PM" && hour24 !== 12) {
          hour24 += 12;
        } else if (formData.period === "AM" && hour24 === 12) {
          hour24 = 0;
        }

        horario_fav = `${hour24.toString().padStart(2, '0')}:${formData.minutes.padStart(2, '0')}:00`;
      }

      const updateData = {
        nombre_usuario: formData.nombre_usuario,
        pais: formData.pais,
        genero: formData.genero,
        fecha_nacimiento: formatDateForAPI(formData.fecha_nacimiento),
        horario_fav: horario_fav || null,
        intereses: formData.intereses,
        distracciones: formData.distracciones,
      };

      await apiClient.put(`/users/${user.id_usuario}`, updateData);

      Alert.alert("Éxito", "Perfil actualizado correctamente");
    } catch (error: any) {
      console.error("Error updating profile:", error);

      let errorMessage = "Error al actualizar el perfil";
      if (error.response) {
        if (error.response.status === 400) {
          errorMessage = error.response.data.message || "Datos inválidos";
        } else if (error.response.status === 409) {
          errorMessage = "El nombre de usuario ya está en uso";
        } else if (error.response.status === 401) {
          errorMessage = "Sesión expirada. Por favor inicia sesión nuevamente";
        }
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    // Validations
    if (!validateRequired(passwordData.currentPassword)) {
      Alert.alert("Error", "La contraseña actual es requerida");
      return;
    }

    if (!validateRequired(passwordData.newPassword)) {
      Alert.alert("Error", "La nueva contraseña es requerida");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert("Error", "La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    try {
      await apiClient.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      Alert.alert("Éxito", "Contraseña cambiada correctamente");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswordFields(false);
    } catch (error: any) {
      console.error("Error changing password:", error);

      let errorMessage = "Error al cambiar la contraseña";
      if (error.response) {
        if (error.response.status === 400) {
          errorMessage = "Contraseña actual incorrecta";
        } else if (error.response.status === 401) {
          errorMessage = "Sesión expirada. Por favor inicia sesión nuevamente";
        }
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = async () => {
    setDeleteLoading(true);

    try {
      await apiClient.delete(`/users/${user?.id_usuario}`);

      Alert.alert(
        "Cuenta eliminada",
        "Tu cuenta ha sido eliminada exitosamente",
        [
          {
            text: "OK",
            onPress: () => {
              if (logout) {
                logout();
              }
              navigation.navigate("Login" as never);
            },
          },
        ]
      );
    } catch (error: any) {
      console.error("Error deleting account:", error);
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

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

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
                    <Picker.Item label={country.label} value={country.value} />
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
                    <Picker.Item label={gender.label} value={gender.value} />
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
                        <Picker.Item label={hour.label} value={hour.value} />
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
                        <Picker.Item label={minute.label} value={minute.value} />
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
                        <Picker.Item label={period.label} value={period.value} />
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

            {/* Intereses */}
            <View style={styles.inputGroup}>
              <Text style={styles.sectionTitle}>¿Cuáles son tus intereses principales?</Text>
              <TouchableOpacity
                style={styles.multiSelectButton}
                onPress={() => setShowInterestsModal(true)}
                disabled={loading}
              >
                <Text style={styles.multiSelectButtonText}>
                  {formData.intereses.length > 0
                    ? `${formData.intereses.length} seleccionados`
                    : "Seleccionar intereses"}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#9CA3AF" />
              </TouchableOpacity>
              <View style={styles.chipsContainer}>
                {formData.intereses.map((id) => {
                  const interest = interests.find(i => i.id === id);
                  return interest ? (
                    <Chip
                      key={id}
                      label={interest.nombre}
                      onRemove={() => handleChange("intereses", formData.intereses.filter(i => i !== id))}
                    />
                  ) : null;
                })}
              </View>
            </View>

            {/* Distracciones */}
            <View style={styles.inputGroup}>
              <Text style={styles.sectionTitle}>
                ¿Cuáles son tus 2 distracciones más comunes?
              </Text>
              <TouchableOpacity
                style={styles.multiSelectButton}
                onPress={() => setShowDistractionsModal(true)}
                disabled={loading}
              >
                <Text style={styles.multiSelectButtonText}>
                  {formData.distracciones.length > 0
                    ? `${formData.distracciones.length} seleccionados`
                    : "Seleccionar distracciones"}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#9CA3AF" />
              </TouchableOpacity>
              <View style={styles.chipsContainer}>
                {formData.distracciones.map((id) => {
                  const distraction = distractions.find(d => d.id === id);
                  return distraction ? (
                    <Chip
                      key={id}
                      label={distraction.nombre}
                      onRemove={() => handleChange("distracciones", formData.distracciones.filter(d => d !== id))}
                    />
                  ) : null;
                })}
              </View>
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

                  {/* Contraseña actual */}
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

                  {/* Nueva contraseña */}
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

                  {/* Confirmar nueva contraseña */}
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
                      style={styles.secondaryButton}
                      onPress={handleChangePassword}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.secondaryButtonText}>Cambiar contraseña</Text>
                      )}
                    </TouchableOpacity>

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
                      <Text style={styles.cancelButtonText}>Cancelar</Text>
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

      {/* Multi-select modals */}
      <MultiSelectModal
        visible={showInterestsModal}
        title="Seleccionar Intereses"
        items={interests}
        selected={formData.intereses}
        onSelect={(selected: number[]) => handleChange("intereses", selected)}
        onClose={() => setShowInterestsModal(false)}
      />

      <MultiSelectModal
        visible={showDistractionsModal}
        title="Seleccionar Distracciones (máx 2)"
        items={distractions}
        selected={formData.distracciones}
        onSelect={(selected: number[]) => handleChange("distracciones", selected)}
        onClose={() => setShowDistractionsModal(false)}
        maxSelect={2}
      />

      {/* Delete modal */}
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
  multiSelectButton: {
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
  multiSelectButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#8B5CF6",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
  },
  chipText: {
    color: "#FFFFFF",
    fontSize: 14,
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
  modalConfirmButton: {
    flex: 1,
    backgroundColor: "#8B5CF6",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  modalConfirmText: {
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
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#8B5CF6",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ProfileScreen;