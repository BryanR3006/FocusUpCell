import React from 'react';
import {
  View,
  Text,
  Switch,
  Platform,
  StyleSheet,
} from 'react-native';

interface NotificationToggleProps {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}

export const NotificationToggle: React.FC<NotificationToggleProps> = ({
  title,
  description,
  enabled,
  onToggle,
}) => {
  return (
    <View style={[
      styles.container,
      Platform.OS === 'ios' ? styles.containerIOS : styles.containerAndroid
    ]}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{ false: '#4B5563', true: '#3B82F6' }}
          thumbColor={enabled ? '#FFFFFF' : '#9CA3AF'}
          ios_backgroundColor="#4B5563"
          style={styles.switch}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(35, 35, 35, 0.95)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  containerIOS: {
    backgroundColor: 'rgba(35, 35, 35, 0.85)',
  },
  containerAndroid: {
    backgroundColor: 'rgba(35, 35, 35, 0.95)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  textContainer: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
  },
  switch: {
    transform: Platform.OS === 'ios' ? [{ scaleX: 0.9 }, { scaleY: 0.9 }] : [],
  },
});

export default NotificationToggle;