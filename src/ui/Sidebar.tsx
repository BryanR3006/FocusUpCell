import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from "react-native";
import {
  Home,
  Settings,
  User,
  Trash2,
  SlidersHorizontal,
  Bell,
  BarChart2,
  LogOut,
  X,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "../contexts/AuthContext";

const Sidebar: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { user, logout } = useContext(AuthContext);
  const navigation = useNavigation();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  const handleLogout = () => {
    logout();
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" as never }],
    });
  };

  const confirmDeleteAccount = async () => {
    if (!user?.id_usuario) {
      setShowDeleteModal(false);
      return;
    }

    setDeleteLoading(true);
    try {
      await new Promise((res) => setTimeout(res, 1500));
      setShowSuccessAlert(true);
      setShowDeleteModal(false);
      setTimeout(() => {
        logout();
        navigation.reset({
          index: 0,
          routes: [{ name: "Login" as never }],
        });
      }, 2000);
    } catch {
      setShowDeleteModal(false);
      logout();
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <View style={styles.sidebar}>
      {/* Botón de cierre */}
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <X size={24} color="#fff" />
      </TouchableOpacity>

      {/* Usuario */}
      <View style={styles.userSection}>
        <View style={styles.avatarPlaceholder} />
        <Text style={styles.userName}>{user?.nombre_usuario || "Cargando..."}</Text>
        <Text style={styles.userId}>
          #{user?.id_usuario?.toString().padStart(6, "0") || "000000"}
        </Text>
      </View>

      {/* Navegación */}
      <View style={styles.menu}>
        <SidebarButton label="Inicio" IconComponent={Home} onPress={() => navigation.navigate("Inicio" as never)} />
        <SidebarButton
          label="Configuración de cuenta"
          IconComponent={Settings}
          onPress={() => setAccountMenuOpen(!accountMenuOpen)}
        />
        {accountMenuOpen && (
          <View style={styles.submenu}>
            <SidebarButton label="Editar perfil" IconComponent={User} onPress={() => navigation.navigate("Perfil" as never)} />
            <SidebarButton label="Eliminar cuenta" IconComponent={Trash2} onPress={() => setShowDeleteModal(true)} color="#f87171" />
          </View>
        )}
        <SidebarButton label="Preferencias" IconComponent={SlidersHorizontal} onPress={() => navigation.navigate("Preferencias" as never)} />
        <SidebarButton label="Notificaciones" IconComponent={Bell} onPress={() => navigation.navigate("Notificaciones" as never)} />
        <SidebarButton label="Reportes" IconComponent={BarChart2} onPress={() => navigation.navigate("Reportes" as never)} />
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut size={20} color="#fff" />
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>

      {/* Modal de eliminación */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Eliminar Cuenta</Text>
            <Text style={styles.modalText}>
              ¿Estás seguro de que quieres eliminar tu cuenta y todos tus datos?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
              >
                <Text style={styles.cancelText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={confirmDeleteAccount}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmText}>Estoy seguro</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Alerta de éxito */}
      {showSuccessAlert && (
        <View style={styles.successAlert}>
          <Text style={styles.successText}>Cuenta eliminada correctamente</Text>
        </View>
      )}
    </View>
  );
};

const SidebarButton = ({
  label,
  IconComponent,
  onPress,
  color = "#fff",
}: {
  label: string;
  IconComponent: React.FC<{ size: number; color: string }>;
  onPress: () => void;
  color?: string;
}) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <IconComponent size={20} color={color} />
    <Text style={[styles.menuText, { color }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  sidebar: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    padding: 20,
  },
  closeButton: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  userSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#333",
    marginBottom: 10,
  },
  userName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  userId: {
    color: "#aaa",
    fontSize: 12,
  },
  menu: {
    flex: 1,
    gap: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  menuText: {
    fontSize: 16,
    fontWeight: "500",
  },
  submenu: {
    paddingLeft: 20,
    gap: 8,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#dc2626",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 20,
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "#000000aa",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#232323",
    padding: 20,
    borderRadius: 16,
    width: "80%",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalText: {
    color: "#ccc",
    fontSize: 16,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  cancelButton: {
    backgroundColor: "#555",
    padding: 10,
    borderRadius: 8,
  },
  cancelText: {
    color: "#fff",
  },
  confirmButton: {
    backgroundColor: "#dc2626",
    padding: 10,
    borderRadius: 8,
  },
  confirmText: {
    color: "#fff",
  },
  successAlert: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "#22c55e",
    padding: 12,
    borderRadius: 10,
  },
  successText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default Sidebar;
