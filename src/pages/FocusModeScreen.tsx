import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeModules } from
import { PageLayout } from '../ui/PageLayout';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const { InstalledAppsModule, FocusAppBlockModule, FocusNotificationBlockModule } = NativeModules;

interface AppInfo {
  packageName: string;
  appName: string;
  blockApp: boolean;
  blockNotifications: boolean;
}

const FocusModeScreen: React.FC = () => {
  const navigation = useNavigation();
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    try {
      const installedApps = await InstalledAppsModule.getInstalledApps();
      const appsWithSettings = installedApps.map((app: any) => ({
        packageName: app.packageName,
        appName: app.appName,
        blockApp: false, // TODO: load from storage
        blockNotifications: false, // TODO: load from storage
      }));
      setApps(appsWithSettings);
    } catch (error) {
      console.error('Error loading apps:', error);
      Alert.alert('Error', 'No se pudieron cargar las aplicaciones');
    } finally {
      setLoading(false);
    }
  };

  const toggleAppBlock = async (packageName: string, block: boolean) => {
    try {
      if (block) {
        await FocusAppBlockModule.enableAppBlocking([packageName]);
      } else {
        // For manual control, we might need to disable all and re-enable others
        // This is simplified - in practice, you'd track all blocked apps
        await FocusAppBlockModule.disableAppBlocking();
      }

      setApps(prev => prev.map(app =>
        app.packageName === packageName ? { ...app, blockApp: block } : app
      ));
    } catch (error) {
      console.error('Error toggling app block:', error);
      Alert.alert('Error', 'No se pudo cambiar la configuración');
    }
  };

  const toggleNotificationBlock = async (packageName: string, block: boolean) => {
    try {
      if (block) {
        await FocusNotificationBlockModule.enableNotificationBlocking([packageName]);
      } else {
        await FocusNotificationBlockModule.disableNotificationBlocking();
      }

      setApps(prev => prev.map(app =>
        app.packageName === packageName ? { ...app, blockNotifications: block } : app
      ));
    } catch (error) {
      console.error('Error toggling notification block:', error);
      Alert.alert('Error', 'No se pudo cambiar la configuración');
    }
  };

  const renderAppItem = ({ item }: { item: AppInfo }) => (
    <View style={styles.appItem}>
      <View style={styles.appInfo}>
        <Text style={styles.appName}>{item.appName}</Text>
        <Text style={styles.packageName}>{item.packageName}</Text>
      </View>

      <View style={styles.controls}>
        <View style={styles.controlItem}>
          <Text style={styles.controlLabel}>Bloquear App</Text>
          <Switch
            value={item.blockApp}
            onValueChange={(value) => toggleAppBlock(item.packageName, value)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={item.blockApp ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>

        <View style={styles.controlItem}>
          <Text style={styles.controlLabel}>Bloquear Notificaciones</Text>
          <Switch
            value={item.blockNotifications}
            onValueChange={(value) => toggleNotificationBlock(item.packageName, value)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={item.blockNotifications ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <PageLayout title="Modo Enfoque Total">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Cargando aplicaciones...</Text>
        </View>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Modo Enfoque Total">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color="#E6EEF8" />
          </TouchableOpacity>
          <Text style={styles.title}>Modo Enfoque Total</Text>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.headerText, styles.appColumn]}>Lista de Apps</Text>
          <Text style={[styles.headerText, styles.controlColumn]}>Restringir Acceso a App</Text>
          <Text style={[styles.headerText, styles.controlColumn]}>Restringir Notificaciones</Text>
        </View>

        <FlatList
          data={apps}
          keyExtractor={(item) => item.packageName}
          renderItem={renderAppItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      </View>
    </PageLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171717',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E6EEF8',
  },
  tableHeader: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },
  appColumn: {
    flex: 2,
  },
  controlColumn: {
    flex: 1,
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A2536',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  appInfo: {
    flex: 2,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E6EEF8',
    marginBottom: 4,
  },
  packageName: {
    fontSize: 12,
    color: '#64748B',
  },
  controls: {
    flex: 2,
    flexDirection: 'row',
  },
  controlItem: {
    flex: 1,
    alignItems: 'center',
  },
  controlLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9CA3AF',
  },
});

export default FocusModeScreen;