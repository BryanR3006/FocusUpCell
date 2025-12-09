// src/pages/Register.tsx (VERSIÓN FINAL CORREGIDA)
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ChevronLeft,
} from 'lucide-react-native';
import { apiClient } from '../clientes/apiClient';
import { API_ENDPOINTS } from '../utils/constants';
import { validateUsername, validateEmail, validatePassword } from '../utils/validationUtils';
import { RootStackParamList } from '../types/navigation';

export const Register: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  
  const [formData, setFormData] = useState({
    nombre_usuario: '',
    correo: '',
    password: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string>('');
  const [usernameError, setUsernameError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [showPasswordHint, setShowPasswordHint] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof typeof formData, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    setError('');

    // Validaciones en tiempo real (EXACTAMENTE como web)
    if (field === 'nombre_usuario') {
      if (value !== '') {
        if (!validateUsername(value)) {
          setUsernameError('El nombre de usuario debe tener entre 3 y 20 caracteres y contener solo letras, números, guiones bajos o guiones.');
        } else {
          setUsernameError('');
        }
      } else {
        setUsernameError('');
      }
    } else if (field === 'correo') {
      if (value !== '') {
        if (!validateEmail(value)) {
          setEmailError('Correo electrónico inválido');
        } else {
          setEmailError('');
        }
      } else {
        setEmailError('');
      }
    } else if (field === 'password') {
      if (value !== '') {
        if (!validatePassword(value)) {
          setPasswordError('La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y caracteres especiales.');
        } else {
          setPasswordError('');
        }
      } else {
        setPasswordError('');
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      // Validación completa (EXACTAMENTE como web)
      if (usernameError || emailError || passwordError) {
        setError('Corrige los errores en el formulario antes de continuar.');
        return;
      }

      if (!formData.nombre_usuario || !formData.correo || !formData.password) {
        setError('Todos los campos obligatorios deben estar completos.');
        return;
      }

      if (formData.password !== confirmPassword) {
        setError('Las contraseñas no coinciden');
        return;
      }

      // Persistir nombre de usuario y correo en AsyncStorage (igual que localStorage en web)
      await AsyncStorage.multiSet([
        ['focusup:register:username', formData.nombre_usuario],
        ['focusup:register:email', formData.correo],
      ]);

      // Solicitar código de verificación al backend (EXACTAMENTE como web)
      await apiClient.post(API_ENDPOINTS.REQUEST_VERIFICATION_CODE, {
        email: formData.correo,
        password: formData.password,
      });

      // Navegar al segundo paso pasando la contraseña (EXACTAMENTE como web)
      navigation.navigate('RegisterStep2', {
        password: formData.password
      });

    } catch (error: any) {
      console.error('Error en registro:', error);
      const apiError = error as { response?: { data?: { error?: string } }; message?: string };
      const errorMessage = apiError?.response?.data?.error || apiError?.message || 'Error al solicitar código de verificación';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    Alert.alert('Google Sign In', 'Continuar con Google - Funcionalidad en desarrollo');
  };

  return (
    <SafeAreaView style={styles.wrapper}>
      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Botón de volver (igual que web) */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ChevronLeft size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.content}>
          {/* Logo */}
          <Image
            source={require('../../assets/img/Logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          {/* Formulario */}
          <View style={styles.formCard}>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Nombre de usuario */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Nombre de usuario <Text style={styles.required}>*</Text>
              </Text>
              <View style={[
                styles.inputContainer,
                usernameError ? styles.inputError : null,
              ]}>
                <User size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  placeholder="Nombre de usuario"
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                  value={formData.nombre_usuario}
                  onChangeText={(text) => handleChange('nombre_usuario', text)}
                  editable={!loading}
                  autoCapitalize="none"
                />
              </View>
              {usernameError ? (
                <Text style={styles.fieldError}>{usernameError}</Text>
              ) : null}
            </View>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Correo electrónico <Text style={styles.required}>*</Text>
              </Text>
              <View style={[
                styles.inputContainer,
                emailError ? styles.inputError : null,
              ]}>
                <Mail size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  placeholder="Correo electrónico"
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                  value={formData.correo}
                  onChangeText={(text) => handleChange('correo', text)}
                  editable={!loading}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              {emailError ? (
                <Text style={styles.fieldError}>{emailError}</Text>
              ) : null}
            </View>

            {/* Contraseña */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Contraseña <Text style={styles.required}>*</Text>
              </Text>
              <View style={[
                styles.inputContainer,
                passwordError ? styles.inputError : null,
              ]}>
                <Lock size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  placeholder="Contraseña"
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                  value={formData.password}
                  onChangeText={(text) => handleChange('password', text)}
                  editable={!loading}
                  secureTextEntry={!showPassword}
                  onFocus={() => setShowPasswordHint(true)}
                  onBlur={() => setShowPasswordHint(false)}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#6B7280" />
                  ) : (
                    <Eye size={20} color="#6B7280" />
                  )}
                </TouchableOpacity>
              </View>
              
              {/* Sugerencia de contraseña (EXACTAMENTE como web) */}
              {showPasswordHint && (
                <View style={styles.passwordHint}>
                  <Text style={styles.hintText}>
                    La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas y números.
                  </Text>
                </View>
              )}
              
              {passwordError ? (
                <Text style={styles.fieldError}>{passwordError}</Text>
              ) : null}
            </View>

            {/* Confirmar Contraseña */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Confirmar Contraseña <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputContainer}>
                <Lock size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  placeholder="Confirmar Contraseña"
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  editable={!loading}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color="#6B7280" />
                  ) : (
                    <Eye size={20} color="#6B7280" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Botón Siguiente */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {loading ? "Solicitando código..." : "Siguiente"}
                </Text>
              )}
            </TouchableOpacity>

            {/* Separador */}
            <View style={styles.separator}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>o</Text>
              <View style={styles.separatorLine} />
            </View>

            {/* Botón Google */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              activeOpacity={0.8}
            >
              <Image
                source={require('../../assets/img/google.png')}
                style={styles.googleIcon}
              />
              <Text style={styles.googleButtonText}>Continuar con Google</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#171717',
  },
  container: {
    flexGrow: 1,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 40,
  },
  logo: {
    width: 280,
    height: 100,
    marginBottom: 30,
  },
  formCard: {
    width: '100%',
    backgroundColor: 'rgba(35, 35, 35, 0.95)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(51, 51, 51, 0.5)',
  },
  errorBox: {
    backgroundColor: '#EF4444',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#1F2937',
    fontSize: 16,
    paddingVertical: 14,
    paddingRight: 16,
  },
  eyeButton: {
    padding: 8,
    marginRight: 8,
  },
  passwordHint: {
    marginTop: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  hintText: {
    color: '#93C5FD',
    fontSize: 12,
    lineHeight: 16,
  },
  fieldError: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#374151',
  },
  separatorText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginHorizontal: 16,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    gap: 12,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  googleButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
});