import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { auth } from "../../lib/firebaseConfig";

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Profile</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>You're not logged in</Text>
          <Text style={styles.emptySubtitle}>
            Log in to view your profile and manage your account.
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push("/(auth)/login")}
          >
            <Text style={styles.loginButtonText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const initial = (user.email?.[0] ?? "U").toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.emailText}>{user.email}</Text>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Member Since</Text>
          <Text style={styles.infoValue}>
            {user.metadata.creationTime
              ? new Date(user.metadata.creationTime).toLocaleDateString()
              : "—"}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => auth.signOut()}
      >
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9F7F4", padding: 20 },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1F1F1F",
    marginBottom: 30,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F1F1F",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#888",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: "#E46A41",
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
  },
  loginButtonText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  avatarContainer: { alignItems: "center", marginBottom: 30 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E46A41",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: { fontSize: 32, fontWeight: "700", color: "#FFF" },
  emailText: { fontSize: 16, color: "#666" },
  infoCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: { fontSize: 15, color: "#888" },
  infoValue: { fontSize: 15, fontWeight: "600", color: "#1F1F1F" },
  logoutButton: {
    backgroundColor: "#EAEAEA",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  logoutText: { color: "#FF3B30", fontWeight: "600", fontSize: 16 },
});
