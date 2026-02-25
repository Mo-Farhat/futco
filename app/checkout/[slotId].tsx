import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { collection, doc, runTransaction } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { FEATURED_COURTS } from "../../constants/data";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../lib/firebaseConfig";

export default function CheckoutScreen() {
  const { slotId, courtId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const court = FEATURED_COURTS.find((c) => c.id === courtId);
  const [loading, setLoading] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      router.replace("/(auth)/login");
    }
  }, [user]);

  // For MVP, we mock the slot data if not found in Firestore
  const slotTime = "18:00 - 19:00";
  const slotDate = "Oct 12, 2026";
  const price = court ? court.price : 4000;
  const serviceFee = 250;
  const total = price + serviceFee;

  if (!court || !user) return <View />;

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Mocking Stripe Payment Success for MVP UI (would use initPaymentSheet here)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Firebase Transaction to lock slot & create booking
      const slotRef = doc(db, "Slots", slotId as string);

      await runTransaction(db, async (transaction) => {
        // In a real app, we check if slot exists.
        // If not, we still proceed for this demo by assuming we create it if missing
        const slotDoc = await transaction.get(slotRef);
        if (slotDoc.exists() && slotDoc.data().isBooked) {
          throw new Error("Slot is already booked!");
        }

        // Mark slot as booked
        transaction.set(
          slotRef,
          {
            courtId,
            date: slotDate,
            time: slotTime,
            isBooked: true,
          },
          { merge: true },
        );

        // Create booking record
        const bookingRef = doc(collection(db, "Bookings"));
        transaction.set(bookingRef, {
          slotId,
          userId: user.uid,
          courtId,
          date: slotDate,
          time: slotTime,
          amountPaid: total,
          status: "confirmed",
          paymentId: "mock_stripe_pi_123",
          createdAt: new Date().toISOString(),
        });
      });

      Alert.alert("Success", "Payment successful! Booking confirmed.", [
        { text: "OK", onPress: () => router.replace("/(player)/bookings") },
      ]);
    } catch (err: any) {
      Alert.alert(
        "Payment Failed",
        err.message || "Could not complete booking.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F1F1F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review & Pay</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Booking Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderIcon}>
            <Ionicons name="tennisball-outline" size={24} color="#2D8B4E" />
          </View>
          <Text style={styles.sectionLabel}>BOOKING DETAILS</Text>
          <Text style={styles.courtName}>{court.name}</Text>
          <Text style={styles.dateTimeText}>
            {slotDate}, {slotTime}
          </Text>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowText}>Court Rental</Text>
            <Text style={styles.rowValue}>LKR {price}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowText}>Service Fee</Text>
            <Text style={styles.rowValue}>LKR {serviceFee}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <View>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalAmount}>LKR {total}</Text>
            </View>
            <View style={styles.checkIconWrapper}>
              <Ionicons name="checkmark" size={16} color="#1E8E3E" />
            </View>
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color="#666"
            style={{ marginTop: 2 }}
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.infoTitle}>Cancellation Policy</Text>
            <Text style={styles.infoText}>
              Free cancellation until 2 hours before the slot. After that, a 50%
              fee applies.
            </Text>
          </View>
        </View>

        {/* Payment Methods */}
        <Text style={styles.paymentMethodTitle}>Payment Method</Text>
        <TouchableOpacity
          style={[styles.paymentMethodCard, styles.paymentMethodActive]}
        >
          <View style={styles.paymentIconBg}>
            <Ionicons name="logo-apple" size={20} color="#FFF" />
          </View>
          <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={styles.paymentType}>Apple Pay</Text>
            <Text style={styles.paymentDefault}>Default</Text>
          </View>
          <Ionicons name="radio-button-on" size={24} color="#2D8B4E" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.paymentMethodCard}>
          <View style={[styles.paymentIconBg, { backgroundColor: "#F0F0F0" }]}>
            <Ionicons name="card-outline" size={20} color="#666" />
          </View>
          <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={styles.paymentType}>Mastercard •••• 4242</Text>
            <Text style={styles.paymentDefault}>Expires 12/25</Text>
          </View>
          <Ionicons name="radio-button-off" size={24} color="#EAEAEA" />
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.payButton}
          onPress={handlePayment}
          disabled={loading}
        >
          <Text style={styles.payButtonText}>
            {loading ? "Processing..." : `Pay LKR ${total}`}
          </Text>
          {!loading && <Ionicons name="arrow-forward" size={20} color="#FFF" />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F7F2" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1F1F1F" },
  spacer: { width: 44 },
  content: { paddingHorizontal: 20 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
    marginBottom: 20,
  },
  cardHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FDF1EE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#888",
    letterSpacing: 1,
    marginBottom: 8,
  },
  courtName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F1F1F",
    marginBottom: 4,
    textAlign: "center",
  },
  dateTimeText: { fontSize: 15, color: "#666", marginBottom: 20 },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "#F0F0F0",
    borderStyle: "dashed",
    marginBottom: 20,
  },
  row: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  rowText: { fontSize: 15, color: "#1F1F1F" },
  rowValue: { fontSize: 15, fontWeight: "600", color: "#1F1F1F" },
  totalRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: { fontSize: 13, color: "#888", marginBottom: 4 },
  totalAmount: { fontSize: 28, fontWeight: "700", color: "#2D8B4E" },
  checkIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E6F4EA",
    alignItems: "center",
    justifyContent: "center",
  },
  infoBox: {
    backgroundColor: "#E8F1EC",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    marginBottom: 30,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A6F5C",
    marginBottom: 4,
  },
  infoText: { fontSize: 13, color: "#6A8E7D", lineHeight: 20 },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F1F1F",
    marginBottom: 16,
  },
  paymentMethodCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  paymentMethodActive: { borderColor: "#2D8B4E" },
  paymentIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#1F1F1F",
    alignItems: "center",
    justifyContent: "center",
  },
  paymentType: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F1F1F",
    marginBottom: 2,
  },
  paymentDefault: { fontSize: 13, color: "#888" },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#F0F7F2",
    padding: 24,
    paddingBottom: 40,
  },
  payButton: {
    backgroundColor: "#2D8B4E",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 18,
    borderRadius: 30,
    shadowColor: "#2D8B4E",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  payButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
    marginRight: 8,
  },
});
