# Mobile App Refactoring Implementation Plan

## Executive Summary

This document provides a comprehensive technical roadmap to transform the FocusUpCell React Native/Expo mobile application from its current monolithic architecture into a production-ready, maintainable, and scalable codebase. The plan addresses the critical HIGH PRIORITY issues identified in the architecture analysis while maintaining feature compatibility.

## Current State Assessment

### Critical Issues to Address

1. **Monolithic Home Component**: 2329-line `Home.tsx` violating SRP
2. **Hardcoded Data**: Mock data instead of API integration
3. **Testing Infrastructure**: Minimal test coverage (1 file)
4. **Error Handling**: Missing error boundaries
5. **State Management**: Inconsistent patterns

### Success Criteria

- ✅ Home component < 200 lines
- ✅ 100% API-driven data (no hardcoded mocks)
- ✅ 80%+ test coverage
- ✅ Comprehensive error boundaries
- ✅ Standardized state management

## Phase 1: Component Refactoring & Architecture Restructuring

### 1.1 File Structure Transformation

**Current Structure:**

```
src/pages/
├── Home.tsx (2329 lines - MONOLITHIC)
```

**Target Structure:**

```
src/
├── components/
│   ├── home/
│   │   ├── UserStatsSection.tsx
│   │   ├── StudyMethodsSection.tsx
│   │   ├── MusicPlayerSection.tsx
│   │   ├── RecentSessionsSection.tsx
│   │   ├── UpcomingEventsSection.tsx
│   │   └── HomeOrchestrator.tsx
│   └── common/
│       ├── ErrorBoundary.tsx
│       ├── LoadingSpinner.tsx
│       └── RetryButton.tsx
├── hooks/
│   ├── useUserStats.ts
│   ├── useStudyMethods.ts
│   ├── useRecentSessions.ts
│   ├── useUpcomingEvents.ts
│   └── useApi.ts
├── pages/
│   └── Home.tsx (orchestrator - <200 lines)
```

### 1.2 Home.tsx Refactoring

**Before (2329 lines):**

```typescript
const Home: React.FC = () => {
  // 15+ state variables
  // 800+ lines of data fetching
  // 1000+ lines of UI rendering
  // Inline styles and constants
  // Mixed concerns
};
```

**After (Home.tsx - ~150 lines):**

```typescript
import React from "react";
import { SafeAreaView, ScrollView, StatusBar } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { useFocusEffect } from "@react-navigation/native";
import UserStatsSection from "../components/home/UserStatsSection";
import StudyMethodsSection from "../components/home/StudyMethodsSection";
import MusicPlayerSection from "../components/home/MusicPlayerSection";
import RecentSessionsSection from "../components/home/RecentSessionsSection";
import UpcomingEventsSection from "../components/home/UpcomingEventsSection";
import ErrorBoundary from "../components/common/ErrorBoundary";

const Home: React.FC = () => {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // Trigger refresh in child components via context or props
    setRefreshing(false);
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0b0b0b" />
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#3B82F6"
            />
          }
        >
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>
              ¡Hola, {user?.nombre_usuario || "Estudiante"}! 👋
            </Text>
            <Text style={styles.welcomeSubtitle}>
              Tu progreso de estudio hoy
            </Text>
          </View>

          <UserStatsSection />
          <StudyMethodsSection />
          <MusicPlayerSection />
          <RecentSessionsSection />
          <UpcomingEventsSection />
        </ScrollView>
      </SafeAreaView>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b0b" },
  scrollView: { flex: 1 },
  welcomeSection: { padding: 16, marginTop: 20, marginBottom: 24 },
  welcomeTitle: { color: "#E6EEF8", fontSize: 28, fontWeight: "900" },
  welcomeSubtitle: { color: "#9CA3AF", fontSize: 15, marginTop: 8 },
});

export default Home;
```

### 1.3 Extracted Component Example: UserStatsSection.tsx

```typescript
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useUserStats } from "../../hooks/useUserStats";
import StatCard from "../common/StatCard";
import LoadingSpinner from "../common/LoadingSpinner";
import ErrorBoundary from "../common/ErrorBoundary";

interface UserStatsSectionProps {
  style?: any;
}

const UserStatsSection: React.FC<UserStatsSectionProps> = ({ style }) => {
  const { stats, loading, error, refetch } = useUserStats();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, style]}>
        <Text style={styles.errorText}>Error loading stats</Text>
        <RetryButton onPress={refetch} />
      </View>
    );
  }

  const statCards = [
    {
      icon: "Clock",
      value: formatStudyTime(stats.totalStudyTime),
      label: "Tiempo Total",
      subtitle: "de estudio",
      color: "#3B82F6",
    },
    {
      icon: "Target",
      value: `${stats.averageConcentration}%`,
      label: "Concentración",
      subtitle: "promedio",
      color: "#10B981",
    },
    {
      icon: "TrendingUp",
      value: stats.streakDays.toString(),
      label: "Racha",
      subtitle: "días seguidos",
      color: "#F59E0B",
    },
    {
      icon: "BookOpen",
      value: stats.activeMethods.toString(),
      label: "Métodos",
      subtitle: "activos",
      color: "#8B5CF6",
    },
  ];

  return (
    <ErrorBoundary>
      <View style={[styles.container, style]}>
        <Text style={styles.sectionTitle}>Tu Progreso</Text>
        <View style={styles.statsGrid}>
          {statCards.map((stat, index) => (
            <StatCard key={`stat-${index}`} {...stat} />
          ))}
        </View>
      </View>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, marginBottom: 24 },
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
  errorContainer: {
    padding: 16,
    alignItems: "center",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 14,
    marginBottom: 8,
  },
});

export default UserStatsSection;
```

### 1.4 Custom Hook Example: useUserStats.ts

```typescript
import { useState, useEffect, useCallback } from "react";
import { apiClient } from "../clientes/apiClient";
import type { UserProgress } from "../types/api";

interface UseUserStatsReturn {
  stats: UserProgress;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const initialStats: UserProgress = {
  totalMethods: 0,
  completedMethods: 0,
  totalSessions: 0,
  totalMusic: 0,
  activeMethods: 0,
  upcomingEvents: 0,
  totalStudyTime: 0,
  averageConcentration: 75,
  streakDays: 0,
};

export const useUserStats = (): UseUserStatsReturn => {
  const [stats, setStats] = useState<UserProgress>(initialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch from multiple endpoints and aggregate
      const [methodsResponse, sessionsResponse, eventsResponse] =
        await Promise.all([
          apiClient.get("/reports/methods"),
          apiClient.get("/reports/sessions"),
          apiClient.get("/eventos"),
        ]);

      const userMethods = methodsResponse.data || [];
      const userSessions = sessionsResponse.data || [];
      const userEvents = eventsResponse.data || [];

      // Calculate stats (extracted from Home.tsx logic)
      const completedMethods = userMethods.filter(
        (m: any) => m.progreso === 100
      ).length;
      const activeMethods = userMethods.filter(
        (m: any) => (m.progreso || 0) > 0 && (m.progreso || 0) < 100
      ).length;

      const totalStudyTime = userSessions
        .filter((s: any) => s.estado === "completado")
        .reduce(
          (total: number, session: any) => total + (session.tiempo_total || 0),
          0
        );

      const pendingEvents = userEvents.filter(
        (e: any) => e.estado === "pendiente"
      ).length;

      // Calculate streak (simplified version)
      const streakDays = calculateStreakDays(userSessions);

      const calculatedStats: UserProgress = {
        totalMethods: userMethods.length,
        completedMethods,
        totalSessions: userSessions.length,
        totalMusic: 0, // Would need separate endpoint
        activeMethods,
        upcomingEvents: pendingEvents,
        totalStudyTime,
        averageConcentration: 75, // Would need calculation
        streakDays,
      };

      setStats(calculatedStats);
    } catch (err: any) {
      console.error("Error fetching user stats:", err);
      setError(err.message || "Failed to load user statistics");
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    await fetchUserStats();
  }, [fetchUserStats]);

  useEffect(() => {
    fetchUserStats();
  }, [fetchUserStats]);

  return { stats, loading, error, refetch };
};

// Helper function extracted from Home.tsx
const calculateStreakDays = (sessions: any[]): number => {
  if (sessions.length === 0) return 0;

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const recentSessions = sessions.filter((session) => {
    const sessionDate = new Date(session.fecha_creacion);
    return sessionDate >= sevenDaysAgo;
  });

  const uniqueDays = new Set(
    recentSessions.map((session) => {
      const date = new Date(session.fecha_creacion);
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    })
  );

  return uniqueDays.size;
};
```

## Phase 2: API Integration & Data Management

### 2.1 API Endpoint Mapping

**Web to Mobile API Mapping:**

| Web Endpoint            | Mobile Usage          | Status     | Priority |
| ----------------------- | --------------------- | ---------- | -------- |
| `GET /reports/methods`  | User methods progress | ✅ Exists  | HIGH     |
| `GET /reports/sessions` | User sessions data    | ✅ Exists  | HIGH     |
| `GET /eventos`          | Upcoming events       | ✅ Exists  | HIGH     |
| `GET /musica/albums`    | Music albums          | ✅ Exists  | MEDIUM   |
| `GET /user/stats`       | Aggregated user stats | ❌ Missing | HIGH     |
| `GET /study-methods`    | Available methods     | ✅ Exists  | HIGH     |
| `GET /sessions/recent`  | Recent sessions       | ❌ Missing | MEDIUM   |

### 2.2 Enhanced ApiClient with Error Handling

**Current ApiClient Issues:**

- No loading states
- Generic error handling
- No retry UI feedback

**Enhanced Version:**

```typescript
// Add to ApiClient
interface ApiResponse<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Generic hook for API calls
export const useApi = <T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): ApiResponse<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.get<T>(endpoint, options);
      setData(result);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [endpoint, options]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};
```

### 2.3 Error Boundary Implementation

```typescript
import React, { Component, ReactNode } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { AlertTriangle, RefreshCw } from "lucide-react-native";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <AlertTriangle size={48} color="#EF4444" />
          <Text style={styles.title}>Oops! Something went wrong</Text>
          <Text style={styles.message}>
            {this.state.error?.message || "An unexpected error occurred"}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={this.handleRetry}
          >
            <RefreshCw size={16} color="#FFFFFF" />
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#0b0b0b",
  },
  title: {
    color: "#E6EEF8",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    color: "#9CA3AF",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3B82F6",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ErrorBoundary;
```

## Phase 3: Testing Infrastructure Setup

### 3.1 Package.json Configuration

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --coverage --watchAll=false"
  },
  "devDependencies": {
    "@testing-library/react-native": "^12.4.0",
    "@testing-library/jest-native": "^5.4.0",
    "jest": "^29.7.0",
    "jest-expo": "^50.0.0",
    "react-test-renderer": "19.1.0"
  },
  "jest": {
    "preset": "jest-expo",
    "setupFilesAfterEnv": ["<rootDir>/jest.setup.js"],
    "collectCoverageFrom": [
      "src/**/*.{ts,tsx}",
      "!src/**/*.d.ts",
      "!src/types/**"
    ],
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

### 3.2 Jest Configuration (jest.config.js)

```javascript
module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jsdom",
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg))",
  ],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/types/**",
    "!src/**/*.test.{ts,tsx}",
    "!src/**/__tests__/**",
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  moduleNameMapping: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};
```

### 3.3 Jest Setup (jest.setup.js)

```javascript
import "@testing-library/jest-native/extend-expect";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock expo-av
jest.mock("expo-av", () => ({
  Audio: {
    setAudioModeAsync: jest.fn(),
    Sound: {
      createAsync: jest.fn(),
    },
  },
}));

// Mock react-navigation
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  useFocusEffect: jest.fn(),
}));

// Global test utilities
global.fetch = jest.fn();
```

### 3.4 Example Test: ApiClient

```typescript
import { api } from "../src/clientes/apiClient";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Mock fetch globally
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe("ApiClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe("GET requests", () => {
    it("should make successful GET request with auth token", async () => {
      const mockToken = "test-token";
      const mockResponse = { data: { id: 1, name: "Test" } };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(mockToken);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        headers: new Map(),
      } as any);

      const result = await api.get("/test-endpoint");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/v1/test-endpoint",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
            "Content-Type": "application/json",
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it("should handle 401 responses and trigger logout", async () => {
      const mockToken = "invalid-token";
      const mockLogout = jest.fn();

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(mockToken);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: "Unauthorized" }),
        headers: new Map(),
      } as any);

      // Mock the auth bridge
      jest.doMock("../src/clientes/authBridge", () => ({
        getAuthBridge: () => ({
          logout: mockLogout,
        }),
      }));

      try {
        await api.get("/protected-endpoint");
        fail("Should have thrown error");
      } catch (error: any) {
        expect(error.message).toContain("Authentication expired");
        expect(mockLogout).toHaveBeenCalled();
      }
    });

    it("should retry on network errors", async () => {
      const mockToken = "test-token";
      const mockResponse = { data: "success" };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(mockToken);

      // First two calls fail, third succeeds
      mockFetch
        .mockRejectedValueOnce(new Error("Network error"))
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
          headers: new Map(),
        } as any);

      const result = await api.get("/test-endpoint", { retries: 3 });

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result).toEqual(mockResponse);
    });
  });

  describe("Error handling", () => {
    it("should throw ApiError for client errors", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue("token");
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: "Bad Request" }),
        headers: new Map(),
      } as any);

      try {
        await api.get("/test-endpoint");
        fail("Should have thrown ApiError");
      } catch (error: any) {
        expect(error.kind).toBe("client");
        expect(error.status).toBe(400);
        expect(error.message).toBe("Bad Request");
      }
    });

    it("should throw ApiError for server errors", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue("token");
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: "Internal Server Error" }),
        headers: new Map(),
      } as any);

      try {
        await api.get("/test-endpoint");
        fail("Should have thrown ApiError");
      } catch (error: any) {
        expect(error.kind).toBe("server");
        expect(error.status).toBe(500);
      }
    });
  });
});
```

### 3.5 Example Component Test

```typescript
import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import UserStatsSection from "../src/components/home/UserStatsSection";

// Mock the hook
jest.mock("../src/hooks/useUserStats");
const mockUseUserStats = require("../src/hooks/useUserStats").useUserStats;

describe("UserStatsSection", () => {
  const mockStats = {
    totalMethods: 5,
    completedMethods: 2,
    totalSessions: 10,
    totalMusic: 15,
    activeMethods: 3,
    upcomingEvents: 2,
    totalStudyTime: 3600, // 1 hour
    averageConcentration: 85,
    streakDays: 7,
  };

  beforeEach(() => {
    mockUseUserStats.mockReturnValue({
      stats: mockStats,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  it("renders user stats correctly", () => {
    render(<UserStatsSection />);

    expect(screen.getByText("Tu Progreso")).toBeTruthy();
    expect(screen.getByText("1h")).toBeTruthy(); // Formatted study time
    expect(screen.getByText("85%")).toBeTruthy(); // Concentration
    expect(screen.getByText("7")).toBeTruthy(); // Streak days
    expect(screen.getByText("3")).toBeTruthy(); // Active methods
  });

  it("shows loading state", () => {
    mockUseUserStats.mockReturnValue({
      stats: mockStats,
      loading: true,
      error: null,
      refetch: jest.fn(),
    });

    render(<UserStatsSection />);
    expect(screen.getByTestId("loading-spinner")).toBeTruthy();
  });

  it("shows error state with retry button", () => {
    const mockRefetch = jest.fn();
    mockUseUserStats.mockReturnValue({
      stats: mockStats,
      loading: false,
      error: "Failed to load",
      refetch: mockRefetch,
    });

    render(<UserStatsSection />);

    expect(screen.getByText("Error loading stats")).toBeTruthy();
    const retryButton = screen.getByText("Retry");
    fireEvent.press(retryButton);
    expect(mockRefetch).toHaveBeenCalled();
  });

  it("matches snapshot", () => {
    const { toJSON } = render(<UserStatsSection />);
    expect(toJSON()).toMatchSnapshot();
  });
});
```

## Phase 4: State Management Standardization

### 4.1 Enhanced Context with useReducer

**Current Pattern (useState):**

```typescript
const [activeSession, setActiveSession] = useState(null);
const [isMinimized, setIsMinimized] = useState(false);
// Multiple setters, hard to track state changes
```

**Improved Pattern (useReducer):**

```typescript
interface ConcentrationSessionState {
  activeSession: ActiveSession | null;
  isMinimized: boolean;
  showContinueModal: boolean;
  isSyncing: boolean;
  tabLockToken: string | null;
  showCountdown: boolean;
  appState: AppStateStatus;
}

type ConcentrationSessionAction =
  | { type: "SET_ACTIVE_SESSION"; payload: ActiveSession | null }
  | { type: "SET_MINIMIZED"; payload: boolean }
  | { type: "SET_CONTINUE_MODAL"; payload: boolean }
  | { type: "SET_SYNCING"; payload: boolean }
  | { type: "SET_COUNTDOWN"; payload: boolean }
  | { type: "SET_APP_STATE"; payload: AppStateStatus };

const initialState: ConcentrationSessionState = {
  activeSession: null,
  isMinimized: false,
  showContinueModal: false,
  isSyncing: false,
  tabLockToken: null,
  showCountdown: false,
  appState: AppState.currentState,
};

function concentrationSessionReducer(
  state: ConcentrationSessionState,
  action: ConcentrationSessionAction
): ConcentrationSessionState {
  switch (action.type) {
    case "SET_ACTIVE_SESSION":
      return { ...state, activeSession: action.payload };
    case "SET_MINIMIZED":
      return { ...state, isMinimized: action.payload };
    case "SET_CONTINUE_MODAL":
      return { ...state, showContinueModal: action.payload };
    case "SET_SYNCING":
      return { ...state, isSyncing: action.payload };
    case "SET_COUNTDOWN":
      return { ...state, showCountdown: action.payload };
    case "SET_APP_STATE":
      return { ...state, appState: action.payload };
    default:
      return state;
  }
}

// Usage in provider
const ConcentrationSessionProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(
    concentrationSessionReducer,
    initialState
  );

  // Actions
  const minimize = useCallback(() => {
    dispatch({ type: "SET_MINIMIZED", payload: true });
  }, []);

  const maximize = useCallback(() => {
    dispatch({ type: "SET_MINIMIZED", payload: false });
  }, []);

  // ... rest of provider logic
};
```

## Implementation Timeline

### Sprint 1 (Week 1): Foundation

- **Day 1-2**: Component extraction planning and file structure setup
- **Day 3-4**: Extract UserStatsSection and useUserStats hook
- **Day 5**: Extract StudyMethodsSection and useStudyMethods hook
- **Day 6-7**: Testing setup and first test implementations

### Sprint 2 (Week 2): Core Refactoring

- **Day 1-2**: Extract remaining sections (Music, Sessions, Events)
- **Day 3-4**: Refactor Home.tsx to orchestrator pattern
- **Day 5**: Implement ErrorBoundary and wrap components
- **Day 6-7**: API integration and remove hardcoded data

### Sprint 3 (Week 3): Testing & Polish

- **Day 1-3**: Comprehensive test coverage (80%+)
- **Day 4-5**: State management standardization
- **Day 6-7**: Integration testing and bug fixes

### Sprint 4 (Week 4): Validation & Deployment

- **Day 1-2**: End-to-end testing
- **Day 3-4**: Performance optimization
- **Day 5**: Documentation update
- **Day 6-7**: Deployment preparation and monitoring setup

## Success Metrics

### Code Quality

- ✅ Home.tsx < 200 lines
- ✅ 15+ extracted components
- ✅ 8+ custom hooks
- ✅ 80%+ test coverage
- ✅ Zero TypeScript errors

### Architecture

- ✅ Single Responsibility Principle compliance
- ✅ Proper separation of concerns
- ✅ Standardized state management
- ✅ Comprehensive error boundaries

### API Integration

- ✅ 100% API-driven data
- ✅ Proper loading/error states
- ✅ Retry mechanisms
- ✅ Offline handling

### Testing

- ✅ Unit tests for all hooks
- ✅ Component snapshot tests
- ✅ API client integration tests
- ✅ CI/CD pipeline configured

## Risk Mitigation

### Technical Risks

1. **Breaking Changes**: Implement feature flags for gradual rollout
2. **Performance Regression**: Monitor bundle size and runtime performance
3. **API Compatibility**: Version API endpoints and maintain backward compatibility

### Team Risks

1. **Learning Curve**: Provide training sessions on new patterns
2. **Code Review Burden**: Establish clear PR guidelines and automated checks
3. **Timeline Pressure**: Break work into small, reviewable PRs

## Conclusion

This implementation plan provides a systematic approach to transform the FocusUpCell mobile application from a monolithic, hard-to-maintain codebase into a modern, scalable, and well-tested application. The phased approach ensures minimal disruption while delivering significant architectural improvements.

The plan focuses on the highest-impact changes first, ensuring that the application becomes more maintainable, testable, and reliable with each phase. By following this roadmap, the development team can deliver a production-ready mobile application that matches the quality standards of the web version.
