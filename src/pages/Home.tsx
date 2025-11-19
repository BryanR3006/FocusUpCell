import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Modal } from "react-native";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import Icon from "react-native-vector-icons/Feather";
import { Menu } from "lucide-react-native";
import Sidebar from "../ui/Sidebar";
import {House,Bomb, Music, Calendar} from "lucide-react-native";



const Home: React.FC = () => {
  // Estado para controlar la visibilidad del sidebar
  const [sidebarVisible, setSidebarVisible] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View>
        <Text style={styles.dos}></Text>

      </View>

      {/* Configuración de la barra de estado */}
      <StatusBar barStyle="light-content" backgroundColor="#171717" />

      {/* Botón para abrir el menú lateral */}
      <TouchableOpacity style={styles.menuToggle} onPress={() => setSidebarVisible(true)}>
        <Menu size={28} color="#fff" />
      </TouchableOpacity>

      {/* Modal que contiene el sidebar */}
      <Modal visible={sidebarVisible} transparent animationType="slide">
        <Sidebar onClose={() => setSidebarVisible(false)} />
      </Modal>

      {/* Encabezado de la pantalla */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Avance del proceso</Text>
      </View>

      {/* Contenido principal de la pantalla */}
      <View style={styles.container}>
        
        {/* Sección del círculo de progreso */}
        <View style={styles.progressContainer}>
          <AnimatedCircularProgress 
            size={240} 
            width={14} 
            fill={23} 
            tintColor="#ffffffff" 
            backgroundColor="#333"
          >
            {() => <Text style={styles.progressText}>0%</Text>}
          </AnimatedCircularProgress>
        </View>

        {/* Contenedor de botones de acción */}
        <View style={styles.actionsContainer}>
          {/* Botón principal - Sesión de concentración */}
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Empezar Sesión de Concentración</Text>
          </TouchableOpacity>

          {/* Botón secundario - Configurar enfoque */}
          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Configurar Enfoque Total</Text>
          </TouchableOpacity>
        </View>

        {/* Barra de navegación inferior */}
        <View style={styles.bottomNav}>
          <House size={28} color="#fff" />
          <Bomb size={28} color="#888" />
          <Music size={28} color="#888" />
          <Calendar size={28} color="#888" />
        </View>
      </View>
    </SafeAreaView>
  );
};

// Estilos del componente
const styles = StyleSheet.create({
  // Contenedor principal seguro para dispositivos
  safeArea: { 
    flex: 1, 
    backgroundColor: "#171717" 
  },
  dos:{
    marginTop:10
  },
  
  // Botón de menú flotante
  menuToggle: {
    position: "absolute", 
    top: 40, 
    left: 20, 
    zIndex: 100,
    backgroundColor: "#333", 
    padding: 10, 
    borderRadius: 10,
  },
  
  // Barra superior con título
  topBar: { 
    alignItems: "center", 
    paddingVertical: 20 
  },
  
  // Texto del título superior
  topBarTitle: { 
    fontSize: 25, 
    fontWeight: "bold", 
    color: "#fff" 
  },
  
  // Contenedor principal del contenido
  container: {
    flex: 1, 
    justifyContent: "space-between",
    paddingHorizontal: 20, 
    paddingBottom: 20,
  },
  
  // Contenedor del círculo de progreso
  progressContainer: { 
    alignItems: "center", 
    marginTop: 50 
  },
  
  // Texto dentro del círculo de progreso
  progressText: { 
    fontSize: 80, 
    color: "#fff", 
    fontWeight: "bold" 
  },
  
  // Contenedor de los botones de acción
  actionsContainer: { 
    gap:18, 
    marginTop: 1 
  },
  
  // Estilos del botón principal
  primaryButton: {
    backgroundColor: "#008cffff", 
    paddingVertical: 16,
    borderRadius: 12, 
    alignItems: "center",
  },
  
  // Texto del botón principal
  primaryButtonText: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "bold" 
  },
  
  // Estilos del botón secundario
  secondaryButton: {
    backgroundColor: "#f97316", 
    paddingVertical: 15,
    borderRadius: 12, 
    alignItems: "center",
    width: "80%",
    alignSelf: "center",
  },
  
  // Texto del botón secundario
  secondaryButtonText: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "bold" 
  },
  
  // Barra de navegación inferior
  bottomNav: {
    flexDirection: "row", 
    justifyContent: "space-around",
    paddingVertical: 12, 
  },
});

export default Home;