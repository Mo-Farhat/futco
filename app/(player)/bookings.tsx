import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FEATURED_COURTS } from "../../constants/data";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../lib/firebaseConfig";
import { generateAndShareReceipt } from "../../lib/receiptGenerator";

export default function BookingsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "Bookings"),
      where("userId", "==", user.uid),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const bookingsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Sort client-side to avoid index requirement for MVP
        bookingsData.sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setBookings(bookingsData);
        setLoading(false);
      },
      (error) => {
        console.error("Bookings listener error:", error);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  const handleDownloadReceipt = async (booking: any) => {
    try {
      const court = FEATURED_COURTS.find((c) => c.id === booking.courtId);
      await generateAndShareReceipt({
        id: booking.id,
        courtName: court?.name || "Premium Court",
        date: booking.date,
        time: booking.time,
        amountPaid: booking.amountPaid,
        status: booking.status,
      });
    } catch (error) {
      Alert.alert("Error", "Could not generate receipt.");
    }
  };

  const renderBooking = ({ item }: { item: any }) => {
    const court = FEATURED_COURTS.find((c) => c.id === item.courtId);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.courtName}>{court?.name || "Unknown Court"}</Text>
          <View
            style={[
              styles.statusBadge,
              item.status === "confirmed"
                ? styles.statusConfirmed
                : styles.statusPending,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                item.status === "confirmed"
                  ? styles.textConfirmed
                  : styles.textPending,
              ]}
            >
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={styles.row}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.rowText}>
            {item.date} • {item.time}
          </Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="pricetag-outline" size={16} color="#666" />
          <Text style={styles.rowText}>LKR {item.amountPaid}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.footer}>
          <Text style={styles.bookingId}>ID: {item.id.slice(0, 8)}</Text>
          <TouchableOpacity onPress={() => handleDownloadReceipt(item)}>
            <Ionicons name="download-outline" size={20} color="#2D8B4E" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>My Bookings</Text>
      {!user ? (
        <View style={styles.emptyState}>
          <Ionicons name="log-in-outline" size={64} color="#CCC" />
          <Text style={styles.emptyText}>Log in to see your bookings</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push("/(auth)/login")}
          >
            <Text style={styles.loginButtonText}>Log In</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <ActivityIndicator
          size="large"
          color="#2D8B4E"
          style={{ marginTop: 20 }}
        />
      ) : bookings.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-number-outline" size={64} color="#CCC" />
          <Text style={styles.emptyText}>No bookings yet</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBooking}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F7F2", padding: 20 },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1F1F1F",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  courtName: { fontSize: 18, fontWeight: "700", color: "#1F1F1F" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusConfirmed: { backgroundColor: "#E6F4EA" },
  statusPending: { backgroundColor: "#FFF4E5" },
  statusText: { fontSize: 12, fontWeight: "700" },
  textConfirmed: { color: "#1E8E3E" },
  textPending: { color: "#FF9800" },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 },
  rowText: { fontSize: 14, color: "#666" },
  divider: { height: 1, backgroundColor: "#F0F0F0", marginVertical: 12 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bookingId: { fontSize: 12, color: "#999", fontFamily: "monospace" },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
  },
  emptyText: { marginTop: 16, fontSize: 16, color: "#999" },
  loginButton: {
    backgroundColor: "#2D8B4E",
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  loginButtonText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
});
