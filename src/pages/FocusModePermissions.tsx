import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Linking, Alert } from 'react-native';
import { NativeModules } from 'react-native';
import { PageLayout } from '../ui/PageLayout';

const { FocusAppBlockModule, FocusNotificationBlockModule } = NativeModules;

const FocusModePermissions: React.FC = () => {
  const [accessibilityEnabled, setAccessibilityEnabled] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(false);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const acc = await FocusAppBlockModule.isAccessibilityEnabled();
      setAccessibilityEnabled(acc);
    } catch (error) {
      console.error('Error checking accessibility:', error);
    }

    try {
      const notif = await FocusNotificationBlockModule.isNotificationAccessEnabled();
      setNotificationEnabled(notif);
    } catch (error) {
      console.error('Error checking notification access:', error);
    }
  };

  const openAccessibilitySettings = () => {
    Linking.openSettings();
  };

  const openNotificationSettings = () => {
    Linking.sendIntent('android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS');
  };

  return (
    <PageLayout title="Focus Mode Permissions">
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 18, marginBottom: 20 }}>
          To use Focus Mode, please enable the following permissions:
        </Text>

        <View style={{ marginBottom: 30 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
            Accessibility Service
          </Text>
          <Text style={{ marginBottom: 10 }}>
            Required for blocking distracting apps during focus sessions.
          </Text>
          <Text style={{ fontSize: 14, color: accessibilityEnabled ? 'green' : 'red', marginBottom: 10 }}>
            Status: {accessibilityEnabled ? 'Enabled' : 'Disabled'}
          </Text>
          {!accessibilityEnabled && (
            <TouchableOpacity
              onPress={openAccessibilitySettings}
              style={{ backgroundColor: '#007bff', padding: 10, borderRadius: 5 }}
            >
              <Text style={{ color: 'white', textAlign: 'center' }}>Enable Accessibility</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ marginBottom: 30 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
            Notification Access
          </Text>
          <Text style={{ marginBottom: 10 }}>
            Required for silencing notifications from distracting apps.
          </Text>
          <Text style={{ fontSize: 14, color: notificationEnabled ? 'green' : 'red', marginBottom: 10 }}>
            Status: {notificationEnabled ? 'Enabled' : 'Disabled'}
          </Text>
          {!notificationEnabled && (
            <TouchableOpacity
              onPress={openNotificationSettings}
              style={{ backgroundColor: '#007bff', padding: 10, borderRadius: 5 }}
            >
              <Text style={{ color: 'white', textAlign: 'center' }}>Enable Notification Access</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={checkPermissions}
          style={{ backgroundColor: '#28a745', padding: 10, borderRadius: 5, marginTop: 20 }}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>Refresh Status</Text>
        </TouchableOpacity>
      </View>
    </PageLayout>
  );
};

export default FocusModePermissions;