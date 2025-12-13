import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Clock, Target, TrendingUp, BookOpen } from "lucide-react-native";
import { useUserStats } from "../../hooks/useUserStats";
import LoadingSpinner from "../common/LoadingSpinner";
import RetryButton from "../common/RetryButton";
import ErrorBoundary from "../common/ErrorBoundary";

interface UserStatsSectionProps {
  style?: any;
}

const UserStatsSection: React.FC<UserStatsSectionProps> = ({ style }) => {
  const { stats, loading, error, refetch } = useUserStats();

  if (loading) {
    return (
      <View style={[styles.container, style]}>
        <LoadingSpinner message="Cargando estadísticas..." />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error cargando estadísticas</Text>
          <RetryButton onPress={refetch} />
        </View>
      </View>
    );
  }

  const formatStudyTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const statsData = [
    {
      Icon: Clock,
      value: formatStudyTime(stats.totalStudyTime),
      label: 'Tiempo Total',
      subtitle: 'de estudio',
      color: '#8B5CF6',
    },
    {
      Icon: Target,
      value: `${stats.averageConcentration}%`,
      label: 'Concentración',
      subtitle: 'promedio',
      color: '#10B981',
    },
    {
      Icon: TrendingUp,
      value: stats.streakDays.toString(),
      label: 'Racha',
      subtitle: 'días seguidos',
      color: '#F59E0B',
    },
    {
      Icon: BookOpen,
      value: stats.activeMethods.toString(),
      label: 'Métodos',
      subtitle: 'activos',
      color: '#06B6D4',
    },
  ];

  return (
    <ErrorBoundary>
      <View style={[styles.container, style]}>
        <Text style={styles.sectionTitle}>Tu Progreso</Text>
        <View style={styles.statsGrid}>
          {statsData.map((stat, index) => (
            <StatCard key={`stat-${index}`} {...stat} />
          ))}
        </View>
      </View>
    </ErrorBoundary>
  );
};

const StatCard = ({ Icon, value, label, color, subtitle }: any) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconContainer, { backgroundColor: `${color}15` }]}>
      <Icon size={22} color={color} />
    </View>
    <View style={styles.statContent}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#E6EEF8",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: "48%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0f0f10",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.03)",
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    color: "#E6EEF8",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 2,
  },
  statLabel: {
    color: "#9CA3AF",
    fontSize: 13,
    fontWeight: "600",
  },
  statSubtitle: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 2,
  },
  errorContainer: {
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 14,
    marginBottom: 12,
    textAlign: "center",
  },
});

export default UserStatsSection;