import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import type { IEvento } from '../types/events';

interface EventCardProps {
  event: IEvento;
  onEdit: (event: IEvento) => void;
  onDelete: (eventId: number) => void;
  onToggleState: (event: IEvento) => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onEdit,
  onDelete,
  onToggleState,
}) => {
  const eventId = event.idEvento;
  const eventName = event.nombreEvento;
  const fecha = event.fechaEvento;
  const hora = event.horaEvento;
  const descripcion = event.descripcionEvento;
  const status = event.estado;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: '#1a1a1a' }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.statusIndicator}>
            <View style={[
              styles.statusDot,
              status === 'completed' ? styles.completedDot : styles.pendingDot,
            ]} />
          </View>
          <Text style={styles.title} numberOfLines={1}>
            {eventName}
          </Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => onToggleState(event)}
            style={styles.actionButton}
          >
            <Text style={{color: status === 'completed' ? '#10b981' : '#9ca3af', fontSize: 20}}>
              {status === 'completed' ? '✓' : '○'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onEdit(event)}
            style={styles.actionButton}
          >
            <Text style={{color: '#60a5fa', fontSize: 20}}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onDelete(eventId!)}
            style={styles.actionButton}
          >
            <Text style={{color: '#f87171', fontSize: 20}}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.infoRow}>
          <Text style={{color: '#9ca3af', fontSize: 16}}>📅</Text>
          <Text style={styles.infoText}>
            {fecha ? formatDate(fecha) : 'Fecha no disponible'}
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={{color: '#9ca3af', fontSize: 16}}>🕒</Text>
          <Text style={styles.infoText}>
            {hora ? formatTime(hora) : 'Hora no disponible'}
          </Text>
        </View>

        {descripcion && (
          <Text style={styles.description} numberOfLines={2}>
            {descripcion}
          </Text>
        )}

        {/* Method and Album indicators */}
        <View style={styles.tags}>
          {event.metodo && (
            <View style={styles.tag}>
              <Text style={{color: '#60a5fa', fontSize: 12}}>📚</Text>
              <Text style={styles.tagText}>
                {event.metodo.nombreMetodo}
              </Text>
            </View>
          )}
          {event.album && (
            <View style={[styles.tag, styles.albumTag]}>
              <Text style={{color: '#a78bfa', fontSize: 12}}>🎵</Text>
              <Text style={styles.tagText}>Música</Text>
            </View>
          )}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[
          styles.statusText,
          status === 'completed' ? styles.completedText : styles.pendingText,
        ]}>
          {status === 'completed' ? 'Completado' : 'Pendiente'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 200,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  statusIndicator: {
    padding: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  completedDot: {
    backgroundColor: '#10b981',
  },
  pendingDot: {
    backgroundColor: '#fbbf24',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  content: {
    gap: 8,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  description: {
    fontSize: 14,
    color: '#d1d5db',
    marginTop: 4,
    lineHeight: 20,
  },
  tags: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  albumTag: {
    backgroundColor: 'rgba(167, 139, 250, 0.2)',
  },
  tagText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  completedText: {
    color: '#10b981',
  },
  pendingText: {
    color: '#fbbf24',
  },
});

export default EventCard;