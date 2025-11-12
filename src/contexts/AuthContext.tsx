// src/contexts/AuthContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { API_BASE_URL } from '../utils/constants';
import type { LoginRequest, AuthResponse, User } from '../types/user';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (credentials: LoginRequest): Promise<void> => {
    try {
      setIsLoading(true);
      console.log('Enviando login a:', `${API_BASE_URL}/users/login`);
      console.log('Credenciales:', credentials);

      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      console.log('Response status:', response.status);
      
      const responseData = await response.json();

      if (!response.ok) {
        // Si la respuesta no es exitosa, lanzar error con el mensaje del servidor
        throw new Error(
          responseData.message || 
          responseData.error || 
          `Error ${response.status}: ${response.statusText}`
        );
      }

      // Verificar la estructura de la respuesta exitosa
      if (!responseData.success) {
        throw new Error(responseData.message || 'Error en la autenticación');
      }

      // Extraer datos de la respuesta - manejar diferentes estructuras posibles
      const authToken = responseData.token || responseData.data?.token;
      const userData = responseData.user || responseData.data?.user;

      if (!authToken) {
        throw new Error('No se recibió token de autenticación');
      }

      if (!userData) {
        throw new Error('No se recibieron datos del usuario');
      }

      // Guardar en el estado
      setToken(authToken);
      setUser(userData);

      // Guardar en AsyncStorage
      await AsyncStorage.setItem('authToken', authToken);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));

      console.log('Login exitoso');

    } catch (error) {
      console.error('Error completo en login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setToken(null);
      setUser(null);
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
    } catch (error) {
      console.error('Error en logout:', error);
    }
  };

  // Cargar datos guardados al iniciar
  React.useEffect(() => {
    const loadStoredData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken');
        const storedUser = await AsyncStorage.getItem('userData');
        
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error loading stored auth:', error);
      }
    };

    loadStoredData();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      logout, 
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};