import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
} from "react-native";
import { ChevronRight } from "lucide-react-native";
import { LOCAL_METHOD_ASSETS } from "../utils/methodAssets";

const { width } = Dimensions.get("window");

interface Benefit {
  id_beneficio: number;
  descripcion_beneficio: string;
}

interface StudyMethod {
  id_metodo: number;
  nombre_metodo: string;
  descripcion: string;
  beneficios: Benefit[];
  url_imagen?: string;
  color_hexa?: string;
}

interface CardProps {
  method: StudyMethod;
  onViewStepByStep: (method: StudyMethod) => void;
}

export const Card: React.FC<CardProps> = ({ method, onViewStepByStep }) => {
  const [imageError, setImageError] = useState(false);
  const scaleAnim = useState(new Animated.Value(1))[0];
  const opacityAnim = useState(new Animated.Value(1))[0];

  const localAssets = LOCAL_METHOD_ASSETS[method.nombre_metodo];
  const methodColor = localAssets?.color || "#0690cf";
  const methodImage = localAssets?.image;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = () => {
    onViewStepByStep(method);
  };

  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <Animated.View
      style={[
        styles.card,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
          borderLeftColor: methodColor,
          // Reemplazar shadow por elevation para React Native
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
      ]}
    >
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        activeOpacity={0.9}
        style={styles.touchable}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.imageContainer}>
            {methodImage && !imageError ? (
              <Image
                source={{ uri: methodImage }}
                style={styles.image}
                onError={() => setImageError(true)}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  styles.fallbackImage,
                  { backgroundColor: methodColor },
                ]}
              >
                <Text style={styles.fallbackText}>
                  {getInitial(method.nombre_metodo)}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.titleContainer}>
            <Text
              style={[
                styles.title,
                {
                  color: methodColor,
                },
              ]}
              numberOfLines={2}
            >
              {method.nombre_metodo}
            </Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.description} numberOfLines={3}>
            {method.descripcion}
          </Text>
        </View>

        {/* Benefits */}
        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>Beneficios</Text>
          <View style={styles.benefitsList}>
            {Array.isArray(method.beneficios) && method.beneficios.length > 0 ? (
              method.beneficios.slice(0, 3).map((benefit, index) => (
                <View key={benefit.id_beneficio} style={styles.benefitItem}>
                  <View
                    style={[
                      styles.bullet,
                      { backgroundColor: methodColor },
                    ]}
                  />
                  <Text style={styles.benefitText} numberOfLines={2}>
                    {benefit.descripcion_beneficio || "Beneficio no disponible"}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.benefitItem}>
                <View style={[styles.bullet, { backgroundColor: "#6B7280" }]} />
                <Text style={styles.benefitText}>
                  No hay beneficios disponibles
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Button */}
        <View style={styles.actionContainer}>
          <View style={[styles.button, { backgroundColor: methodColor }]}>
            <Text style={styles.buttonText}>Ver guía paso a paso</Text>
            <ChevronRight size={16} color="#FFFFFF" />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#232323",
    borderRadius: 16,
    marginHorizontal: 8,
    padding: 20,
    borderLeftWidth: 4,
  },
  touchable: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
    paddingBottom: 16,
  },
  imageContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    overflow: "hidden",
    marginRight: 12,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  fallbackImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  fallbackText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    lineHeight: 22,
  },
  descriptionContainer: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
    paddingBottom: 16,
  },
  description: {
    color: "#E5E7EB",
    fontSize: 14,
    lineHeight: 20,
  },
  benefitsContainer: {
    marginBottom: 20,
    flex: 1,
  },
  benefitsTitle: {
    color: "#9CA3AF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  benefitsList: {
    gap: 8,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    flexShrink: 0,
  },
  benefitText: {
    color: "#D1D5DB",
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  actionContainer: {
    marginTop: "auto",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default Card;