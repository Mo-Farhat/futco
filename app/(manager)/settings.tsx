import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { auth } from "../../lib/firebaseConfig";

export default function ManagerSettingsScreen() {
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Settings</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Account Type</Text>
        <Text style={styles.value}>Court Manager</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Subscription</Text>
        <View style={styles.freeBadge}>
          <Text style={styles.freeText}>FREE TIER</Text>
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
  container: { flex: 1, backgroundColor: "#1A1A2E", padding: 20 },
  header: { fontSize: 28, fontWeight: "700", color: "#FFF", marginBottom: 24 },
  card: {
    backgroundColor: "#2A2A42",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  label: { color: "#8888AA", fontSize: 13, marginBottom: 4 },
  value: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  freeBadge: {
    backgroundColor: "rgba(228,106,65,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  freeText: {
    color: "#E46A41",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  logoutButton: {
    backgroundColor: "#2A2A42",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  logoutText: { color: "#FF5252", fontWeight: "600", fontSize: 16 },
});
