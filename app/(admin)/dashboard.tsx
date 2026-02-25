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
import { auth, db } from "../../lib/firebaseConfig";

export default function AdminDashboardScreen() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [revenue, setRevenue] = useState(0);

  useEffect(() => {
    // Listen to all bookings for admin
    const q = query(collection(db, "Bookings"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Sort locally
        data.sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setBookings(data);

        // Calculate total revenue for MVP visualization
        const total = data.reduce(
          (sum: number, item: any) => sum + (item.amountPaid || 0),
          0,
        );
        setRevenue(total);
      },
      (error) => {
        console.error("Dashboard bookings listener error:", error);
      },
    );
    return unsubscribe;
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <TouchableOpacity onPress={() => auth.signOut()}>
          <Ionicons name="log-out-outline" size={24} color="#1F1F1F" />
        </TouchableOpacity>
      </View>

      <View style={styles.kpiCard}>
        <Text style={styles.kpiLabel}>TOTAL REVENUE</Text>
        <Text style={styles.kpiValue}>LKR {revenue.toLocaleString()}</Text>
      </View>

      <Text style={styles.sectionTitle}>Recent Bookings</Text>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>
                {item.date} at {item.time}
              </Text>
              <Text style={styles.rowSubtitle}>
                Booking ID: {item.id.slice(0, 6)}
              </Text>
            </View>
            <Text style={styles.rowAmount}>+ LKR {item.amountPaid}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA", padding: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: { fontSize: 28, fontWeight: "700", color: "#1F1F1F" },
  kpiCard: {
    backgroundColor: "#1F1F1F",
    padding: 24,
    borderRadius: 16,
    marginBottom: 30,
  },
  kpiLabel: { color: "#888", fontSize: 12, fontWeight: "700", marginBottom: 8 },
  kpiValue: { color: "#FFF", fontSize: 32, fontWeight: "700" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F1F1F",
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  rowTitle: { fontSize: 16, fontWeight: "600", color: "#1F1F1F" },
  rowSubtitle: { fontSize: 12, color: "#888", marginTop: 4 },
  rowAmount: { fontSize: 16, fontWeight: "700", color: "#1E8E3E" },
});
