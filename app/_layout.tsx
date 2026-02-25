import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import "react-native-reanimated";
import { AuthProvider, useAuth } from "../context/AuthContext";

// Routes that require authentication
const PROTECTED_SEGMENTS = ["checkout", "(manager)"];

const MainLayout = () => {
  const { user, role, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const currentSegment = segments[0] as string;
    const inAuthGroup =
      currentSegment === "(auth)" || currentSegment === "(manager-auth)";
    const inProtectedRoute = PROTECTED_SEGMENTS.includes(currentSegment);
    const inManagerGroup = currentSegment === "(manager)";

    if (!user && inProtectedRoute) {
      // Redirect to login if trying to access protected route without auth
      router.replace("/(auth)/login");
    } else if (user && inAuthGroup) {
      // Redirect away from login if already authenticated
      if (role === "manager") {
        router.replace("/(manager)/dashboard");
      } else {
        router.replace("/(player)");
      }
    } else if (user && role === "manager" && !inManagerGroup && !inAuthGroup) {
      // Manager logged in but not in manager portal
      router.replace("/(manager)/dashboard");
    }
  }, [user, role, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#E46A41" />
      </View>
    );
  }

  return <Slot />;
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
