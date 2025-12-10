import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute, NavigationProp, RouteProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChevronLeft } from 'lucide-react-native';
import { apiClient } from '../clientes/apiClient';
import { API_ENDPOINTS } from '../utils/constants';
import type { RootStackParamList } from '../types/navigation';

export const RegisterStep2: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'RegisterStep2'>>();

  // Obtener la contraseña del estado de la ruta (igual que web)
  const { password } = route.params;

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Redirigir si no hay contraseña (seguridad) - igual que web
  useEffect(() => {
    if (!password) {
      Alert.alert(
        'Acceso no permitido',
        'Por favor, completa el primer paso del registro.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [password, navigation]);

  // Manejar cambios en los inputs del código (igual que web)
  const handleInputChange = (index: number, value: string) => {
    // Solo permitir números y un dígito por input
    const numericValue = value.replace(/[^0-9]/g, '');
    if (numericValue.length > 1) return;

    const newCode = [...code];
    newCode[index] = numericValue;
    setCode(newCode);

    // Mover al siguiente input automáticamente (igual que web)
    if (numericValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Manejar teclas de navegación (Backspace)
  const handleKeyPress = (index: number, e: any) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Función para reenviar código (igual que web)
  const handleResendCode = async () => {
    setResendLoading(true);
    setError('');

    try {
      const email = await AsyncStorage.getItem('focusup:register:email');
      if (!email) {
        throw new Error('Correo electrónico no encontrado');
      }

      await apiClient.post(API_ENDPOINTS.REQUEST_VERIFICATION_CODE, {
        email,
        password,
      });

      // Mostrar mensaje de éxito (igual que web)
      setError(''); // Limpiar errores previos
      Alert.alert('Éxito', 'Código reenviado exitosamente');
      
    } catch (error: any) {
      console.error('Error resending code:', error);
      const apiError = error as { response?: { data?: { error?: string } }; message?: string };
      const errorMessage = apiError?.response?.data?.error || apiError?.message || 'Error al reenviar código';
      setError(errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  // Manejar envío del formulario (igual que web)
  const handleSubmit = async () => {
    const fullCode = code.join('');

    if (fullCode.length !== 6) {
      setError('Por favor ingresa el código completo de 6 dígitos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Recuperar datos almacenados de forma segura (igual que web)
      const email = await AsyncStorage.getItem('focusup:register:email');
      const username = await AsyncStorage.getItem('focusup:register:username');

      if (!email || !username) {
        throw new Error('Datos de registro incompletos');
      }

      // PASO 1: Verificar código de verificación (igual que web)
      // NOTA: El endpoint VERIFY_CODE en web, en móvil debería ser el mismo
      await apiClient.post(API_ENDPOINTS.VERIFY_CODE, {
        email,
        codigo: fullCode,
      });

      // PASO 2: Registrar usuario completo (igual que web)
      await apiClient.post(API_ENDPOINTS.REGISTER, {
        email,
        username,
        password, // Contraseña obtenida de forma segura
      });

      // Limpiar datos temporales (igual que web)
      await AsyncStorage.multiRemove([
        'focusup:register:email',
        'focusup:register:username',
      ]);

      // Marcar que es el primer login (igual que web)
      await AsyncStorage.setItem('focusup:firstLogin', 'true');

      // Mostrar alerta de éxito y redirigir (igual que web)
      Alert.alert(
        '¡Registro Completado!',
        'Tu cuenta ha sido creada exitosamente. Ahora puedes iniciar sesión.',
        [
          {
            text: 'Iniciar Sesión',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );

    } catch (error: any) {
      console.error('Error in registration process:', error);
      const apiError = error as { response?: { data?: { error?: string } }; message?: string };
      const errorMessage = apiError?.response?.data?.error || apiError?.message || 'Error en el proceso de registro';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.wrapper}>
      {/* Botón de volver (igual que web) */}
      <TouchableOpacity
        onPress={() => navigation.navigate('Register')}
        style={styles.backButton}
      >
        <ChevronLeft size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.container}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>Focus Up</Text>
        </View>

        {/* Formulario */}
        <View style={styles.formCard}>
          <Text style={styles.title}>
            Hemos enviado un código de verificación a tu correo para completar el registro
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Inputs de código (igual que web - 6 dígitos) */}
          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                style={[
                  styles.codeInput,
                  digit ? styles.codeInputFilled : null,
                ]}
                value={digit}
                onChangeText={(value) => handleInputChange(index, value)}
                onKeyPress={(e) => handleKeyPress(index, e)}
                keyboardType="numeric"
                maxLength={1}
                editable={!loading}
                selectTextOnFocus
              />
            ))}
          </View>

          {/* Botón de verificar y registrar (igual que web) */}
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
                {loading ? 'Verificando y Registrando...' : 'Verificar y Registrarme'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Botón para reenviar código (igual que web) */}
          <View style={styles.resendContainer}>
            <TouchableOpacity
              onPress={handleResendCode}
              disabled={resendLoading}
              style={styles.resendButton}
            >
              {resendLoading ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : (
                <Text style={styles.resendText}>
                  {resendLoading ? 'Reenviando...' : 'Reenviar código'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#171717',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    marginBottom: 40,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  formCard: {
    width: '100%',
    backgroundColor: 'rgba(35, 35, 35, 0.95)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(51, 51, 51, 0.5)',
    alignItems: 'center',
  },
  title: {
    color: '#D1D5DB',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  errorBox: {
    backgroundColor: '#EF4444',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    width: '100%',
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 32,
    width: '100%',
  },
  codeInput: {
    width: 48,
    height: 48,
    backgroundColor: '#111827',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3B82F6',
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  codeInputFilled: {
    backgroundColor: '#1E40AF',
    borderColor: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    width: '100%',
    alignItems: 'center',
  },
  resendButton: {
    padding: 8,
  },
  resendText: {
    color: '#60A5FA',
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});