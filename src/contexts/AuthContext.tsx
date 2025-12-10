import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  login: (token: string, userData: any) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
          const parsedUserData = JSON.parse(userData);
          setIsAuthenticated(true);
          setUser(parsedUserData);
          
          // ✅ IMPORTANTE: Verifica si userId existe y guárdalo por separado
          if (parsedUserData && parsedUserData.id_usuario) {
            const existingUserId = await AsyncStorage.getItem('userId');
            if (!existingUserId) {
              await AsyncStorage.setItem('userId', parsedUserData.id_usuario.toString());
              console.log('UserID guardado en checkAuth:', parsedUserData.id_usuario.toString());
            }
          }
        } catch (parseError) {
          console.error('Error parsing user data:', parseError);
          await AsyncStorage.removeItem('userData');
          await AsyncStorage.removeItem('userId'); // Limpia también userId
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (token: string, userData: any) => {
    try {
      // ✅ GUARDA LOS 3 ITEMS IGUAL QUE EN WEB
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      
      // ✅ ESTA ES LA LÍNEA QUE FALTA:
      if (userData && userData.id_usuario) {
        await AsyncStorage.setItem('userId', userData.id_usuario.toString());
        console.log('UserID guardado en login:', userData.id_usuario.toString());
      }
      
      setIsAuthenticated(true);
      setUser(userData);
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // ✅ LIMPIA LOS 3 ITEMS
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('userId'); // Limpia también userId
      
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    user,
    login,
    logout,
    loading
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