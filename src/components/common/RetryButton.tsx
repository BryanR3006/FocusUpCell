import React from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { RefreshCw } from "lucide-react-native";

interface RetryButtonProps {
  onPress: () => void;
  text?: string;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  iconSize?: number;
  testID?: string;
}

const RetryButton: React.FC<RetryButtonProps> = ({
  onPress,
  text = "Retry",
  disabled = false,
  style,
  textStyle,
  iconSize = 16,
  testID = "retry-button"
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
    >
      <RefreshCw size={iconSize} color={disabled ? "#6B7280" : "#FFFFFF"} />
      <Text style={[styles.text, disabled && styles.disabledText, textStyle]}>
        {text}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3B82F6",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  disabled: {
    backgroundColor: "#374151",
  },
  text: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  disabledText: {
    color: "#6B7280",
  },
});

export default RetryButton;