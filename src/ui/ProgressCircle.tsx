import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface ProgressCircleProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  backgroundColor?: string;
  getTextByPercentage?: (pct: number) => string;
  getColorByPercentage?: (pct: number) => string;
}

export const ProgressCircle: React.FC<ProgressCircleProps> = ({
  percentage,
  size = 140,
  strokeWidth = 10,
  backgroundColor = '#9CA3AF',
  getTextByPercentage,
  getColorByPercentage
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Default color function
  const defaultGetColorByPercentage = (pct: number): string => {
    if (pct === 0) return backgroundColor;
    if (pct < 100) return '#FACC15'; // Amarillo para en proceso
    return '#22C55E'; // Verde para completado
  };

  // Default text function
  const defaultGetTextByPercentage = (pct: number): string => {
    if (pct === 0) return 'Sin empezar';
    if (pct < 100) return 'En proceso';
    return 'Completado';
  };

  // Use custom functions if provided, otherwise use defaults
  const colorFunction = getColorByPercentage || defaultGetColorByPercentage;
  const textFunction = getTextByPercentage || defaultGetTextByPercentage;

  const currentColor = percentage === 0 ? backgroundColor : colorFunction(percentage);

  return (
    <View style={styles.container}>
      <View style={[styles.circleContainer, { width: size, height: size }]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Círculo de fondo */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={backgroundColor}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Círculo de progreso */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={currentColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            rotation={-90}
            originX={size / 2}
            originY={size / 2}
          />
        </Svg>
        
        {/* Porcentaje en el centro */}
        <View style={styles.percentageContainer}>
          <Text style={[styles.percentageText, { color: currentColor }]}>
            {percentage}%
          </Text>
        </View>
      </View>

      {/* Texto descriptivo */}
      <Text style={[styles.descriptionText, { color: backgroundColor }]}>
        {textFunction(percentage)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  circleContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  descriptionText: {
    fontSize: 18,
    marginTop: 12,
    textAlign: 'center',
  },
});

export default ProgressCircle;