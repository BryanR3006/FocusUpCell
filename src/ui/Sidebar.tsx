import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Dimensions,
  Animated,
  SafeAreaView,
  Pressable,
  ActivityIndicator,
  Easing,
} from "react-native";
import {
  Home,
  Settings,
  LayoutGrid,
  Bell,
  BarChart3,
  LogOut,
  ChevronDown,
  BookOpen,
  Music,
  Calendar,
  User,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../contexts/AuthContext";
import { useAudio } from '../contexts/AudioContext';

const { width, height } = Dimensions.get("window");
const SIDEBAR_MAX_WIDTH = 420;

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
  currentPage?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  visible,
  onClose,
  currentPage = "dashboard",
}) => {
  const navigation = useNavigation();
  const { user, logout, loading } = useAuth();
  const { stopAndClear } = useAudio();

  const sidebarWidth = Math.min(width * 0.85, SIDEBAR_MAX_WIDTH);
  const slideAnim = React.useRef(new Animated.Value(-sidebarWidth)).current;
  const overlayAnim = React.useRef(new Animated.Value(0)).current;
  const submenuAnim = React.useRef(new Animated.Value(0)).current;
  const [focusToolsOpen, setFocusToolsOpen] = React.useState(false);
  const [logoutLoading, setLogoutLoading] = React.useState(false);

  // Abrir / cerrar con animación
  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(overlayAnim, {
          toValue: 0.5,
          duration: 250,
          useNativeDriver: false,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
          easing: Easing.in(Easing.cubic),
        }),
        Animated.timing(slideAnim, {
          toValue: -sidebarWidth,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.in(Easing.cubic),
        }),
      ]).start();
    }
  }, [visible, sidebarWidth]);

  // Toggle submenu con animación
  const toggleSubmenu = () => {
    const toValue = focusToolsOpen ? 0 : 1;
    setFocusToolsOpen(!focusToolsOpen);
    Animated.timing(submenuAnim, {
      toValue,
      duration: 220,
      useNativeDriver: false,
      easing: Easing.out(Easing.cubic),
    }).start();
  };

  // Cierra con animación y luego llama onClose
  const closeWithAnimation = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
        easing: Easing.in(Easing.cubic),
      }),
      Animated.timing(slideAnim, {
        toValue: -sidebarWidth,
        duration: 240,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }),
    ]).start(() => {
      callback?.();
      onClose();
    });
  };

  const handleNavigation = (path: string) => {
    closeWithAnimation(() => {
      navigation.navigate(path as never);
    });
  };

  const handleLogout = async () => {
  if (logoutLoading) return;
  
  setLogoutLoading(true);
  try {
    console.log('🛑 Iniciando logout con limpieza de audio...');
    
    // 1. PRIMERO: Detener el audio completamente
    if (stopAndClear) {
      await stopAndClear();
      console.log('✅ Audio detenido y limpiado');
    }
    
    // 2. Animación para cerrar el sidebar
    await new Promise<void>((resolve) => {
      Animated.parallel([
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
          easing: Easing.in(Easing.cubic),
        }),
        Animated.timing(slideAnim, {
          toValue: -sidebarWidth,
          duration: 240,
          useNativeDriver: true,
          easing: Easing.in(Easing.cubic),
        }),
      ]).start(() => resolve());
    });

    // 3. Logout de autenticación
    await logout();
    console.log('✅ Sesión cerrada');
    
    onClose();

// Intenta esto:
setTimeout(() => {
  // Esto debería funcionar si navigation está definido
  (navigation as any).reset({
    index: 0,
    routes: [{ name: 'Login' }],
  });
}, 100);
    
    console.log('✅ Logout completado exitosamente');
    
  } catch (error) {
    console.error("❌ Logout failed:", error);
  } finally {
    setLogoutLoading(false);
  }
};

  const menuItems = [
    {
      icon: Home,
      label: "Inicio",
      path: "Home",
      isActive: currentPage === "dashboard",
    },
    {
      icon: User, // Cambiado de Settings a User para perfil
      label: "Perfil",
      path: "Profile",
      isActive: currentPage === "profile",
    },
    {
      icon: LayoutGrid,
      label: "Herramientas",
      path: null,
      isActive: false,
      hasSubmenu: true,
    },
    {
      icon: Bell,
      label: "Notificaciones",
      path: "Notifications",
      isActive: currentPage === "notifications",
    },
    {
      icon: BarChart3,
      label: "Reportes",
      path: "Reports",
      isActive: currentPage === "reports",
    },
  ];

  const submenuItems = [
    {
      icon: BookOpen,
      label: "Métodos de estudio",
      path: "StudyMethods",
    },
    {
      icon: Music,
      label: "Álbum de música",
      path: "MusicAlbums",
    },
    {
      icon: Calendar,
      label: "Eventos",
      path: "Events",
    },
  ];

  // Interpolaciones
  const submenuHeight = submenuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, submenuItems.length * 52],
  });
  const submenuOpacity = submenuAnim.interpolate({ 
    inputRange: [0, 1], 
    outputRange: [0, 1] 
  });
  const chevronRotate = submenuAnim.interpolate({ 
    inputRange: [0, 1], 
    outputRange: ["0deg", "180deg"] 
  });

  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="none" 
      onRequestClose={() => closeWithAnimation()}
    >
      <View style={styles.modalContainer}>
        {/* Backdrop animado */}
        <Pressable style={{ flex: 1 }} onPress={() => closeWithAnimation()}>
          <Animated.View style={[styles.backdrop, { 
            backgroundColor: overlayAnim.interpolate({
              inputRange: [0, 0.5],
              outputRange: ["rgba(0,0,0,0)", "rgba(0,0,0,0.5)"]
            }) 
          }]} />
        </Pressable>

        {/* Sidebar */}
        <Animated.View
          style={[
            styles.sidebar,
            {
              width: sidebarWidth,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.userSection}>
                <View style={styles.userImagePlaceholder}>
                  <Text style={styles.userImageText}>
                    {user?.nombre_usuario?.charAt(0)?.toUpperCase() || "U"}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user?.nombre_usuario || "Usuario"}</Text>
                  <Text style={styles.userId}>
                    #{user?.id_usuario ? user.id_usuario.toString().padStart(6, "0") : "000000"}
                  </Text>
                </View>
              </View>

              <View style={styles.menuSection}>
                {menuItems.map((item, index) => (
                  <View key={index}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={[styles.menuItem, item.isActive && styles.menuItemActive]}
                      onPress={() =>
                        item.path ? handleNavigation(item.path) : toggleSubmenu()
                      }
                    >
                      <View style={styles.menuItemLeft}>
                        <item.icon 
                          size={20} 
                          color={item.isActive ? "#3B82F6" : "#9CA3AF"} 
                        />
                        <Text style={[styles.menuLabel, item.isActive && styles.menuLabelActive]}>
                          {item.label}
                        </Text>
                      </View>

                      {item.hasSubmenu ? (
                        <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
                          <ChevronDown size={16} color="#9CA3AF" />
                        </Animated.View>
                      ) : null}
                    </TouchableOpacity>

                    {/* Submenu animado */}
                    {item.hasSubmenu && (
                      <Animated.View style={[
                        styles.submenu, 
                        { 
                          height: submenuHeight, 
                          opacity: submenuOpacity 
                        }
                      ]}>
                        {submenuItems.map((subItem, subIndex) => (
                          <TouchableOpacity
                            key={subIndex}
                            style={styles.submenuItem}
                            onPress={() => handleNavigation(subItem.path)}
                          >
                            <subItem.icon size={16} color="#6B7280" />
                            <Text style={styles.submenuLabel}>{subItem.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </Animated.View>
                    )}
                  </View>
                ))}
              </View>
            </ScrollView>

            {/* Logout en bottom */}
            <View style={styles.logoutContainer}>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                disabled={logoutLoading || loading}
                activeOpacity={0.8}
              >
                {(logoutLoading || loading) ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <LogOut size={20} color="#FFFFFF" />
                )}
                <Text style={styles.logoutText}>
                  {logoutLoading || loading ? "Cerrando sesión..." : "Cerrar Sesión"}
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    flexDirection: "row",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#171717",
    borderRightWidth: 1,
    borderRightColor: "#333",
  },
  scrollContent: {
    paddingBottom: 24,
  },
  userSection: {
    alignItems: "center",
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  userImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  userImageText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
  },
  userInfo: {
    alignItems: "center",
  },
  userName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  userId: {
    color: "#6B7280",
    fontSize: 14,
  },
  menuSection: {
    padding: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 6,
  },
  menuItemActive: {
    backgroundColor: "#232323",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuLabel: {
    color: "#9CA3AF",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 12,
  },
  menuLabelActive: {
    color: "#3B82F6",
    fontWeight: "600",
  },
  submenu: {
    overflow: "hidden",
    marginLeft: 28,
    marginTop: 4,
  },
  submenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 12,
  },
  submenuLabel: {
    color: "#6B7280",
    fontSize: 14,
  },
  logoutContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EF4444",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 12,
    justifyContent: "center",
  },
  logoutText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});

export default Sidebar;