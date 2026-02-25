import { Ionicons } from "@expo/vector-icons";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../lib/firebaseConfig";

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [courts, setCourts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Listen to manager's courts
    const courtsQuery = query(
      collection(db, "Courts"),
      where("managerId", "==", user.uid),
    );
    const unsubCourts = onSnapshot(courtsQuery, (snap) => {
      setCourts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    // Listen to all bookings
    const bookingsQuery = query(collection(db, "Bookings"));
    const unsubBookings = onSnapshot(
      bookingsQuery,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        data.sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setBookings(data);
        setLoading(false);
      },
      (error) => {
        console.error("Dashboard error:", error);
        setLoading(false);
      },
    );

    return () => {
      unsubCourts();
      unsubBookings();
    };
  }, [user]);

  // Calculate stats
  const totalRevenue = bookings.reduce(
    (sum, b) => sum + (b.amountPaid || 0),
    0,
  );
  const todayBookings = bookings.filter(
    (b) => b.date === new Date().toISOString().split("T")[0],
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#E46A41" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Dashboard</Text>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="tennisball-outline" size={24} color="#E46A41" />
          <Text style={styles.statValue}>{courts.length}</Text>
          <Text style={styles.statLabel}>Courts</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="calendar-outline" size={24} color="#4CAF50" />
          <Text style={styles.statValue}>{todayBookings.length}</Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="receipt-outline" size={24} color="#2196F3" />
          <Text style={styles.statValue}>{bookings.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="cash-outline" size={24} color="#FF9800" />
          <Text style={styles.statValue}>
            {totalRevenue > 0 ? `${(totalRevenue / 1000).toFixed(0)}K` : "0"}
          </Text>
          <Text style={styles.statLabel}>Revenue (LKR)</Text>
        </View>
      </View>

      {/* Recent Bookings */}
      <Text style={styles.sectionTitle}>Recent Bookings</Text>
      {bookings.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={48} color="#3A3A55" />
          <Text style={styles.emptyText}>No bookings yet</Text>
        </View>
      ) : (
        <FlatList
          data={bookings.slice(0, 10)}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <View style={styles.bookingCard}>
              <View style={styles.bookingRow}>
                <Text style={styles.bookingDate}>{item.date}</Text>
                <Text style={styles.bookingAmount}>
                  LKR {item.amountPaid?.toLocaleString()}
                </Text>
              </View>
              <Text style={styles.bookingTime}>{item.time}</Text>
              <Text style={styles.bookingStatus}>
                {item.status?.toUpperCase()}
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A2E",
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: "#2A2A42",
    borderRadius: 16,
    padding: 16,
    width: "47%",
    alignItems: "center",
    gap: 8,
  },
  statValue: { fontSize: 28, fontWeight: "700", color: "#FFF" },
  statLabel: { fontSize: 12, color: "#8888AA", fontWeight: "500" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 16,
  },
  emptyState: { alignItems: "center", marginTop: 40, gap: 12 },
  emptyText: { color: "#8888AA", fontSize: 16 },
  bookingCard: {
    backgroundColor: "#2A2A42",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  bookingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  bookingDate: { color: "#FFF", fontWeight: "600", fontSize: 15 },
  bookingAmount: { color: "#E46A41", fontWeight: "700", fontSize: 15 },
  bookingTime: { color: "#8888AA", fontSize: 13 },
  bookingStatus: {
    color: "#4CAF50",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 6,
  },
});
