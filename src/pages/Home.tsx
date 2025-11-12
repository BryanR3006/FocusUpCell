import React, { useContext } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  StatusBar 
} from "react-native";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigation } from "@react-navigation/native";

const Home: React.FC = () => {
  const { user, logout } = useContext(AuthContext);
  const navigation = useNavigation();

  const handleLogout = () => {
    logout();
    // Navega de vuelta al Login después del logout
    navigation.navigate("Login" as never);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#171717" />
      <View style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeTitle}>¡Bienvenido! 🎉</Text>
          <Text style={styles.userName}>{user?.nombre_usuario || "Usuario"}</Text>
          <Text style={styles.userEmail}>{user?.correo || "usuario@ejemplo.com"}</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Tu Dashboard</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Sesiones hoy</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Minutos focos</Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Iniciar Sesión Focus</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButtonSecondary}>
              <Text style={styles.actionButtonSecondaryText}>Ver Estadísticas</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#171717",
  },
  container: {
    flex: 1,
    backgroundColor: "#171717",
    paddingHorizontal: 20,
  },
  header: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  userName: {
    fontSize: 22,
    color: "#007bff",
    fontWeight: "600",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: "#888",
  },
  content: {
    flex: 1,
    paddingTop: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: "#1a1a1a",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    flex: 0.48,
    borderWidth: 1,
    borderColor: "#333",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007bff",
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    backgroundColor: "#007bff",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  actionButtonSecondary: {
    backgroundColor: "transparent",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#007bff",
  },
  actionButtonSecondaryText: {
    color: "#007bff",
    fontSize: 16,
    fontWeight: "bold",
  },
  logoutButton: {
    backgroundColor: "#dc2626",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 30,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default Home;