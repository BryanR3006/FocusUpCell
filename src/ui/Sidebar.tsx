import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Image,
  Dimensions,
  Animated,
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
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../contexts/AuthContext";

const { width, height } = Dimensions.get("window");

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
  const [focusToolsOpen, setFocusToolsOpen] = React.useState(false);
  const slideAnim = React.useRef(new Animated.Value(-width * 0.8)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -width * 0.8,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleNavigation = (path: string) => {
    onClose();
    navigation.navigate(path as never);
  };

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
    } catch (error) {
      console.error("Logout failed:", error);
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
      icon: Settings,
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Backdrop */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Sidebar Content */}
        <Animated.View
          style={[
            styles.sidebar,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* User Info */}
            <View style={styles.userSection}>
              <View style={styles.userImagePlaceholder}>
                <Text style={styles.userImageText}>
                  {user?.nombre_usuario?.charAt(0) || "U"}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {user?.nombre_usuario || "Usuario"}
                </Text>
                <Text style={styles.userId}>
                  #{user?.id_usuario
                    ? user.id_usuario.toString().padStart(6, "0")
                    : "000000"}
                </Text>
              </View>
            </View>

            {/* Navigation Menu */}
            <View style={styles.menuSection}>
              {menuItems.map((item, index) => (
                <View key={index}>
                  <TouchableOpacity
                    style={[
                      styles.menuItem,
                      item.isActive && styles.menuItemActive,
                    ]}
                    onPress={() =>
                      item.path ? handleNavigation(item.path) : setFocusToolsOpen(!focusToolsOpen)
                    }
                  >
                    <View style={styles.menuItemLeft}>
                      <item.icon
                        size={20}
                        color={item.isActive ? "#FFA200" : "#9CA3AF"}
                      />
                      <Text
                        style={[
                          styles.menuLabel,
                          item.isActive && styles.menuLabelActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </View>
                    {item.hasSubmenu && (
                      <ChevronDown
                        size={16}
                        color="#9CA3AF"
                        style={[
                          styles.chevron,
                          focusToolsOpen && styles.chevronRotated,
                        ]}
                      />
                    )}
                  </TouchableOpacity>

                  {/* Submenu */}
                  {item.hasSubmenu && focusToolsOpen && (
                    <View style={styles.submenu}>
                      {submenuItems.map((subItem, subIndex) => (
                        <TouchableOpacity
                          key={subIndex}
                          style={styles.submenuItem}
                          onPress={() => handleNavigation(subItem.path)}
                        >
                          <subItem.icon size={16} color="#6B7280" />
                          <Text style={styles.submenuLabel}>
                            {subItem.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.loadingSpinner} />
            ) : (
              <LogOut size={20} color="#FFFFFF" />
            )}
            <Text style={styles.logoutText}>
              {loading ? "Cerrando sesión..." : "Cerrar Sesión"}
            </Text>
          </TouchableOpacity>
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
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: width * 0.8,
    backgroundColor: "#232323",
    borderRightWidth: 1,
    borderRightColor: "#333",
  },
  scrollView: {
    flex: 1,
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
    marginBottom: 16,
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
    padding: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  menuItemActive: {
    backgroundColor: "#2A2A2A",
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
    color: "#FFA200",
  },
  chevron: {
    transform: [{ rotate: "0deg" }],
  },
  chevronRotated: {
    transform: [{ rotate: "180deg" }],
  },
  submenu: {
    marginLeft: 32,
    marginTop: 4,
    marginBottom: 8,
    gap: 4,
  },
  submenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 12,
  },
  submenuLabel: {
    color: "#6B7280",
    fontSize: 14,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EF4444",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  logoutText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingSpinner: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    borderTopColor: "transparent",
    borderRadius: 10,
  },
});

export default Sidebar;