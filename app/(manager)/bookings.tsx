import { Ionicons } from "@expo/vector-icons";
import { collection, onSnapshot, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../lib/firebaseConfig";

export default function ManagerBookingsScreen() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "today" | "upcoming">("all");

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "Bookings"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setBookings(data);
    });
    return unsub;
  }, [user]);

  const today = new Date().toISOString().split("T")[0];
  const filtered = bookings.filter((b) => {
    if (filter === "today") return b.date === today;
    if (filter === "upcoming") return b.date >= today;
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Bookings</Text>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(["all", "today", "upcoming"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterText,
                filter === f && styles.filterTextActive,
              ]}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={48} color="#3A3A55" />
          <Text style={styles.emptyText}>No bookings found</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.cardDate}>{item.date}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    item.status === "confirmed"
                      ? styles.confirmedBadge
                      : styles.cancelledBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      item.status === "confirmed"
                        ? styles.confirmedText
                        : styles.cancelledText,
                    ]}
                  >
                    {item.status?.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardTime}>{item.time}</Text>
              <View style={styles.cardRow}>
                <Text style={styles.cardId}>ID: {item.id.slice(0, 8)}</Text>
                <Text style={styles.cardAmount}>
                  LKR {item.amountPaid?.toLocaleString()}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1A1A2E", padding: 20 },
  header: { fontSize: 28, fontWeight: "700", color: "#FFF", marginBottom: 20 },
  filterRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#2A2A42",
  },
  filterTabActive: { backgroundColor: "#E46A41" },
  filterText: { color: "#8888AA", fontWeight: "600" },
  filterTextActive: { color: "#FFF" },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyText: { color: "#8888AA", fontSize: 16 },
  card: {
    backgroundColor: "#2A2A42",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardDate: { color: "#FFF", fontWeight: "600", fontSize: 16 },
  cardTime: { color: "#8888AA", fontSize: 14, marginVertical: 4 },
  cardId: { color: "#8888AA", fontSize: 12, fontFamily: "monospace" },
  cardAmount: { color: "#E46A41", fontWeight: "700", fontSize: 15 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  confirmedBadge: { backgroundColor: "rgba(76,175,80,0.15)" },
  cancelledBadge: { backgroundColor: "rgba(255,82,82,0.15)" },
  statusText: { fontSize: 11, fontWeight: "700" },
  confirmedText: { color: "#4CAF50" },
  cancelledText: { color: "#FF5252" },
});
