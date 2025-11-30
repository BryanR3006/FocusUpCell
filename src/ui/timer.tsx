import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface TimerProps {
  initialMinutes: number;
  onComplete?: () => void;
  color?: string;
}

export const timer: React.FC<TimerProps> = ({ 
  initialMinutes, 
  onComplete, 
  color = '#ef4444' 
}) => {
  const [seconds, setSeconds] = useState(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Formatear tiempo como MM:SS
  const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${secs}`;
  };

  // Iniciar temporizador
  const startTimer = () => {
    if (!isRunning && seconds > 0) {
      setIsRunning(true);
    }
  };

  // Pausar temporizador
  const pauseTimer = () => {
    setIsRunning(false);
  };

  // Reiniciar temporizador
  const resetTimer = () => {
    setIsRunning(false);
    setSeconds(initialMinutes * 60);
    setHasCompleted(false);
  };

  // Efecto para manejar el conteo del temporizador
  useEffect(() => {
    if (isRunning && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setHasCompleted(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, seconds]);

  // Efecto separado para llamar onComplete después de que el estado se haya actualizado
  useEffect(() => {
    if (hasCompleted && onComplete) {
      onComplete();
      setHasCompleted(false); // Reset para evitar llamadas múltiples
    }
  }, [hasCompleted, onComplete]);

  const getButtonText = () => {
    if (isRunning) return 'Pausar';
    if (seconds === initialMinutes * 60) return 'Iniciar';
    return 'Reanudar';
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.timerText, { color }]}>
        {formatTime(seconds)}
      </Text>
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: `${color}E6` }]}
          onPress={resetTimer}
        >
          <Text style={styles.buttonText}>Reiniciar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: `${color}E6` }]}
          onPress={isRunning ? pauseTimer : startTimer}
        >
          <Text style={styles.buttonText}>{getButtonText()}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  timerText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default timer;