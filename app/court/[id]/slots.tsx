import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { FEATURED_COURTS } from "../../../constants/data";
import { useCourts } from "../../../hooks/useCourts";
import { Slot, useSlots } from "../../../hooks/useSlots";

// Generate next 7 days for date picker
function getUpcomingDates() {
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const result = [];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    result.push({
      day: days[d.getDay()],
      date: String(d.getDate()).padStart(2, "0"),
      fullDate: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
      monthLabel: `${months[d.getMonth()]} ${d.getFullYear()}`,
    });
  }
  return result;
}

// Fallback mock slots for when Firestore has no data yet
const MOCK_SLOTS = {
  morning: [
    {
      id: "m1",
      courtId: "",
      date: "",
      time: "09:00 - 10:00",
      price: 4000,
      isBooked: false,
    },
    {
      id: "m2",
      courtId: "",
      date: "",
      time: "10:00 - 11:00",
      price: 4000,
      isBooked: true,
    },
    {
      id: "m3",
      courtId: "",
      date: "",
      time: "11:00 - 12:00",
      price: 4000,
      isBooked: false,
    },
  ],
  afternoon: [
    {
      id: "a1",
      courtId: "",
      date: "",
      time: "14:00 - 15:00",
      price: 4500,
      isBooked: false,
    },
    {
      id: "a2",
      courtId: "",
      date: "",
      time: "15:00 - 16:00",
      price: 4500,
      isBooked: false,
    },
    {
      id: "a3",
      courtId: "",
      date: "",
      time: "16:00 - 17:00",
      price: 5000,
      isBooked: false,
    },
  ],
  evening: [
    {
      id: "e1",
      courtId: "",
      date: "",
      time: "18:00 - 19:00",
      price: 5500,
      isBooked: true,
    },
    {
      id: "e2",
      courtId: "",
      date: "",
      time: "19:00 - 20:00",
      price: 5500,
      isBooked: false,
    },
  ],
};

export default function SlotsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { courts: firestoreCourts } = useCourts();
  const dates = useMemo(() => getUpcomingDates(), []);
  const [selectedDateIdx, setSelectedDateIdx] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  // Resolve court from Firestore or fallback
  const court =
    firestoreCourts.find((c) => c.id === id) ||
    FEATURED_COURTS.find((c) => c.id === id);

  const selectedFullDate = dates[selectedDateIdx].fullDate;
  const { slots: firestoreSlots, loading: slotsLoading } = useSlots(
    id as string,
    selectedFullDate,
  );

  // Use Firestore slots if available, else mock
  const hasFirestoreSlots =
    firestoreSlots.morning.length > 0 ||
    firestoreSlots.afternoon.length > 0 ||
    firestoreSlots.evening.length > 0;
  const slots = hasFirestoreSlots ? firestoreSlots : MOCK_SLOTS;

  if (!court) return <View />;

  const renderSlot = (slot: Slot) => {
    const isSelected = selectedSlot?.id === slot.id;

    if (slot.isBooked) {
      return (
        <View key={slot.id} style={[styles.slotCard, styles.slotDisabled]}>
          <Text style={styles.slotTimeDisabled}>{slot.time}</Text>
          <Ionicons name="lock-closed-outline" size={16} color="#A0A0A0" />
        </View>
      );
    }

    return (
      <TouchableOpacity
        key={slot.id}
        style={[styles.slotCard, isSelected && styles.slotSelected]}
        onPress={() => setSelectedSlot(slot)}
      >
        <Text style={[styles.slotTime, isSelected && styles.slotTimeSelected]}>
          {slot.time}
        </Text>
        {isSelected ? (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="checkmark-circle" size={20} color="#FFF" />
          </View>
        ) : (
          <Text style={styles.slotPrice}>LKR {slot.price}</Text>
        )}
        {isSelected && (
          <Text style={styles.selectedCourtText}>{court.name}</Text>
        )}
      </TouchableOpacity>
    );
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
        <Text style={styles.headerTitle}>{court.name}</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#1F1F1F" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Date Selector */}
        <View style={styles.dateSection}>
          <Text style={styles.monthTitle}>
            {dates[selectedDateIdx].monthLabel}
          </Text>
          <View style={styles.dateSubHeader}>
            <Text style={styles.selectDateText}>Select a date</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateScroll}
          >
            {dates.map((d, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.dateCard,
                  selectedDateIdx === i && styles.dateCardActive,
                ]}
                onPress={() => {
                  setSelectedDateIdx(i);
                  setSelectedSlot(null); // Reset slot selection on date change
                }}
              >
                <Text
                  style={[
                    styles.dayText,
                    selectedDateIdx === i && styles.dayTextActive,
                  ]}
                >
                  {d.day}
                </Text>
                <Text
                  style={[
                    styles.dateNumText,
                    selectedDateIdx === i && styles.dateNumTextActive,
                  ]}
                >
                  {d.date}
                </Text>
                {selectedDateIdx === i && <View style={styles.dateDot} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Time Slots */}
        {slotsLoading ? (
          <ActivityIndicator
            size="large"
            color="#E46A41"
            style={{ marginTop: 40 }}
          />
        ) : (
          <View style={styles.slotsSection}>
            {slots.morning.length > 0 && (
              <>
                <Text style={styles.timeOfDay}>MORNING</Text>
                <View style={styles.slotsGrid}>
                  {slots.morning.map(renderSlot)}
                </View>
              </>
            )}

            {slots.afternoon.length > 0 && (
              <>
                <Text style={styles.timeOfDay}>AFTERNOON</Text>
                <View style={styles.slotsGrid}>
                  {slots.afternoon.map(renderSlot)}
                </View>
              </>
            )}

            {slots.evening.length > 0 && (
              <>
                <Text style={styles.timeOfDay}>EVENING</Text>
                <View style={styles.slotsGrid}>
                  {slots.evening.map(renderSlot)}
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.totalLabel}>Total amount</Text>
          <View style={{ flexDirection: "row", alignItems: "baseline" }}>
            <Text style={styles.totalAmount}>
              LKR {selectedSlot ? selectedSlot.price : "0"}
            </Text>
            <Text style={styles.slotCount}>
              {" "}
              {selectedSlot ? "1 slot" : "0 slots"}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedSlot && styles.continueButtonDisabled,
          ]}
          disabled={!selectedSlot}
          onPress={() =>
            router.push(`/checkout/${selectedSlot?.id}?courtId=${id}`)
          }
        >
          <Text style={styles.continueText}>Continue</Text>
          <Ionicons
            name="arrow-forward"
            size={20}
            color="#FFF"
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9F7F4" },
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
  content: { flex: 1 },
  dateSection: { paddingHorizontal: 20, marginBottom: 30 },
  monthTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F1F1F",
    marginBottom: 8,
  },
  dateSubHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  selectDateText: { fontSize: 14, color: "#888" },
  calendarText: { fontSize: 14, color: "#E46A41", fontWeight: "600" },
  dateScroll: { gap: 12 },
  dateCard: {
    width: 65,
    height: 85,
    borderRadius: 32,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EEE",
  },
  dateCardActive: { backgroundColor: "#E46A41", borderColor: "#E46A41" },
  dayText: { fontSize: 12, color: "#888", fontWeight: "600", marginBottom: 4 },
  dayTextActive: { color: "#FFD5C2" },
  dateNumText: { fontSize: 18, fontWeight: "700", color: "#1F1F1F" },
  dateNumTextActive: { color: "#FFF" },
  dateDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FFF",
    marginTop: 4,
  },
  slotsSection: { paddingHorizontal: 20 },
  timeOfDay: {
    fontSize: 14,
    fontWeight: "600",
    color: "#888",
    marginBottom: 16,
    marginTop: 10,
  },
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  slotCard: {
    width: "48%",
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EEE",
    height: 70,
  },
  slotDisabled: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    flexDirection: "row",
    gap: 6,
  },
  slotSelected: { backgroundColor: "#E46A41", borderColor: "#E46A41" },
  slotTime: { fontSize: 15, fontWeight: "600", color: "#1F1F1F" },
  slotTimeDisabled: { fontSize: 15, fontWeight: "600", color: "#A0A0A0" },
  slotTimeSelected: { color: "#FFF" },
  slotPrice: { fontSize: 13, color: "#888", marginTop: 4 },
  selectedCourtText: { fontSize: 10, color: "#FFF", marginTop: 2 },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    paddingBottom: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -5 },
    elevation: 10,
  },
  totalLabel: { fontSize: 14, color: "#888", marginBottom: 4 },
  totalAmount: { fontSize: 24, fontWeight: "700", color: "#1F1F1F" },
  slotCount: { fontSize: 14, color: "#E46A41", fontWeight: "500" },
  continueButton: {
    backgroundColor: "#E46A41",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 30,
  },
  continueButtonDisabled: { backgroundColor: "#FFD5C2" },
  continueText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});
