import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '../types/user'; // Importa el tipo User

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null; // Cambiado de any a User | null
  token: string | null; // Añadido token como en web
  login: (token: string, userData: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void; // AÑADIDO - igual que web
  loading: boolean;
  showFirstLoginModal?: boolean; // Opcional para mobile
  setShowFirstLoginModal?: (show: boolean) => void; // Opcional para mobile
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFirstLoginModal, setShowFirstLoginModal] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('userData');
      
      console.log('Token:', token ? 'Present' : 'Missing');
      console.log('UserData:', userData ? 'Present' : 'Missing');
      
      if (token && userData) {
        try {
          const parsedUserData: User = JSON.parse(userData);
          
          // Validar que el usuario tenga ID válido (igual que web)
          if (parsedUserData && parsedUserData.id_usuario) {
            setIsAuthenticated(true);
            setUser(parsedUserData);
            setToken(token);
            
            // Guardar userId por separado para consistencia
            await AsyncStorage.setItem('userId', parsedUserData.id_usuario.toString());
            console.log('UserID guardado en checkAuth:', parsedUserData.id_usuario.toString());
          } else {
            // Limpiar datos inválidos si falta ID de usuario (igual que web)
            console.warn('ID de usuario inválido en datos almacenados');
            await clearAuthData();
          }
        } catch (parseError) {
          console.error('Error parsing user data:', parseError);
          await clearAuthData();
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setToken(null);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  // Función auxiliar para limpiar datos de autenticación
  const clearAuthData = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('userData');
    await AsyncStorage.removeItem('userId');
    setIsAuthenticated(false);
    setUser(null);
    setToken(null);
  };

  const login = async (token: string, userData: User) => {
    try {
      // Validar que el usuario tenga ID válido (igual que web)
      if (!userData.id_usuario) {
        throw new Error("ID de usuario inválido en la respuesta");
      }

      // Guardar datos (igual que web)
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      await AsyncStorage.setItem('userId', userData.id_usuario.toString());
      
      console.log('UserID guardado en login:', userData.id_usuario.toString());
      
      setIsAuthenticated(true);
      setUser(userData);
      setToken(token);
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Limpiar datos locales (igual que web)
      await clearAuthData();
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  // ✅ FUNCIÓN CRÍTICA QUE FALTA: updateUser (igual que web)
  const updateUser = (userData: Partial<User>): void => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      
      // Actualizar en AsyncStorage (igual que web actualiza localStorage)
      AsyncStorage.setItem('userData', JSON.stringify(updatedUser))
        .catch(error => console.error('Error updating user in storage:', error));
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    user,
    token,
    login,
    logout,
    updateUser, // ✅ AHORA SÍ ESTÁ INCLUIDA
    loading,
    showFirstLoginModal,
    setShowFirstLoginModal,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;