import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Bell } from 'lucide-react-native';
import { Sidebar } from '../ui/Sidebar';
import { NotificationToggle } from '../ui/NotificationToggle';
import { useNotifications } from '../hooks/useNotifications';

const { width } = Dimensions.get('window');

/**
 * Componente principal de notificaciones para móvil
 */
export const Notification: React.FC = () => {
  const {
    settings,
    loading,
    error,
    updateSetting,
  } = useNotifications();

  const [sidebarVisible, setSidebarVisible] = React.useState(false);

  const handleToggle = async (tipo: keyof typeof settings) => {
    try {
      await updateSetting({
        tipo,
        enabled: !settings[tipo],
      });
    } catch (err) {
      console.error('Failed to update notification setting:', err);
    }
  };

  const handleReload = () => {
    console.log('Recargar notificaciones');
  };

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#171717"
      />
      
      <Sidebar 
        visible={sidebarVisible} 
        onClose={() => setSidebarVisible(false)}
        currentPage="notifications"
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header con botón de menú */}
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            onPress={() => setSidebarVisible(true)}
            style={styles.menuButton}
            activeOpacity={0.7}
          >
            <View style={styles.menuLine} />
            <View style={[styles.menuLine, styles.menuLineMiddle]} />
            <View style={styles.menuLine} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          <View style={styles.mainContainer}>
            <View style={styles.contentContainer}>
              {/* Header Section */}
              <View style={styles.headerSection}>
                <View style={styles.headerTitleContainer}>
                  <View style={styles.titleRow}>
                    <Bell 
                      size={32} 
                      color="#60a5fa" 
                      style={styles.bellIcon}
                    />
                    <Text style={styles.title}>
                      Notificaciones
                    </Text>
                  </View>
                  <Text style={styles.subtitle}>
                    Controla qué notificaciones deseas recibir para mantenerte al día con tus actividades de estudio.
                  </Text>
                </View>
              </View>

              {/* Estado de carga */}
              {loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator 
                    size="large" 
                    color="#3b82f6" 
                    style={styles.loadingSpinner}
                  />
                  <Text style={styles.loadingText}>
                    Cargando notificaciones...
                  </Text>
                </View>
              )}

              {/* Estado de error */}
              {error && !loading && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorIcon}>⚠️</Text>
                  <Text style={styles.errorTitle}>
                    Error al cargar notificaciones
                  </Text>
                  <Text style={styles.errorMessage}>{error}</Text>
                  <TouchableOpacity
                    onPress={handleReload}
                    style={styles.reloadButton}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.reloadButtonText}>
                      Intentar de nuevo
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Contenido principal */}
              {!loading && !error && (
                <>
                  {/* Sección de configuraciones */}
                  <View style={styles.settingsSection}>
                    <Text style={styles.settingsTitle}>
                      Configuraciones
                    </Text>
                    <View style={styles.togglesContainer}>
                      <NotificationToggle
                        title="Notificaciones de eventos"
                        description="Recibe recordatorios sobre tus eventos programados de estudio y concentración."
                        enabled={settings.eventos}
                        onToggle={() => handleToggle('eventos')}
                      />
                      <View style={styles.toggleSpacing} />
                      <NotificationToggle
                        title="Métodos de estudio no terminados"
                        description="Te recordamos completar los métodos de estudio que has iniciado pero no finalizado."
                        enabled={settings.metodosPendientes}
                        onToggle={() => handleToggle('metodosPendientes')}
                      />
                      <View style={styles.toggleSpacing} />
                      <NotificationToggle
                        title="Sesiones de concentración no terminadas"
                        description="Recibe alertas sobre sesiones de concentración que has pausado o abandonado."
                        enabled={settings.sesionesPendientes}
                        onToggle={() => handleToggle('sesionesPendientes')}
                      />
                      <View style={styles.toggleSpacing} />
                      <NotificationToggle
                        title="Motivación semanal"
                        description="Mensajes inspiradores y consejos para mantener tu motivación en el estudio."
                        enabled={settings.motivacion}
                        onToggle={() => handleToggle('motivacion')}
                      />
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171717',
  },
  safeArea: {
    flex: 1,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'rgba(23, 23, 23, 0.8)',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  menuButton: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  menuLine: {
    width: 24,
    height: 2,
    backgroundColor: '#ffffff',
    marginVertical: 2,
  },
  menuLineMiddle: {
    marginLeft: 4,
    width: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: Platform.OS === 'ios' ? 100 : 120,
    paddingBottom: 40,
  },
  mainContainer: {
    minHeight: Dimensions.get('window').height,
    paddingVertical: 32,
  },
  contentContainer: {
    width: '100%',
    paddingHorizontal: 16,
  },
  headerSection: {
    marginBottom: 40,
  },
  headerTitleContainer: {
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  bellIcon: {
    marginRight: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    lineHeight: 24,
    maxWidth: width - 32,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingSpinner: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 18,
    color: '#ffffff',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 16,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 24,
    textAlign: 'center',
  },
  reloadButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  reloadButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
  settingsSection: {
    marginBottom: 48,
  },
  settingsTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 24,
  },
  togglesContainer: {
    // Los estilos de los toggles están en NotificationToggle
  },
  toggleSpacing: {
    height: 16,
  },
});

export default Notification;