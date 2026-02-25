import { Ionicons } from "@expo/vector-icons";
import {
    addDoc,
    collection,
    onSnapshot,
    query,
    where,
} from "firebase/firestore";
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
import { useAuth } from "../../context/AuthContext";
import { db } from "../../lib/firebaseConfig";

// Generate time slots from open to close
function generateTimeSlots(openTime: string, closeTime: string) {
  const slots: string[] = [];
  let [h] = openTime.split(":").map(Number);
  const [endH] = closeTime.split(":").map(Number);
  while (h < endH) {
    const start = `${String(h).padStart(2, "0")}:00`;
    const end = `${String(h + 1).padStart(2, "0")}:00`;
    slots.push(`${start} - ${end}`);
    h++;
  }
  return slots;
}

// Get upcoming 7 days
function getUpcomingDates() {
  const result: string[] = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    result.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
    );
  }
  return result;
}

export default function ManagerSlotsScreen() {
  const { user } = useAuth();
  const [courts, setCourts] = useState<any[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(getUpcomingDates()[0]);
  const [existingSlots, setExistingSlots] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  const dates = getUpcomingDates();

  // Fetch manager's courts
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "Courts"),
      where("managerId", "==", user.uid),
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setCourts(data);
      if (data.length > 0 && !selectedCourt) {
        setSelectedCourt(data[0]);
      }
      setLoading(false);
    });
    return unsub;
  }, [user]);

  // Fetch existing slots for selected court + date
  useEffect(() => {
    if (!selectedCourt || !selectedDate) return;
    const q = query(
      collection(db, "Slots"),
      where("courtId", "==", selectedCourt.id),
      where("date", "==", selectedDate),
    );
    const unsub = onSnapshot(q, (snap) => {
      setExistingSlots(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [selectedCourt, selectedDate]);

  const handleGenerateSlots = async () => {
    if (!selectedCourt) return;
    const openTime = selectedCourt.openTime || "09:00";
    const closeTime = selectedCourt.closeTime || "21:00";
    const times = generateTimeSlots(openTime, closeTime);

    const existingTimes = existingSlots.map((s) => s.time);
    const newTimes = times.filter((t) => !existingTimes.includes(t));

    if (newTimes.length === 0) {
      Alert.alert("Info", "All slots already exist for this date.");
      return;
    }

    setGenerating(true);
    try {
      const promises = newTimes.map((time) =>
        addDoc(collection(db, "Slots"), {
          courtId: selectedCourt.id,
          date: selectedDate,
          time,
          isBooked: false,
          price: selectedCourt.price || 4000,
        }),
      );
      await Promise.all(promises);
      Alert.alert("Success", `${newTimes.length} slot(s) generated!`);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#E46A41" />
      </SafeAreaView>
    );
  }

  if (courts.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.header}>Slot Management</Text>
        <View style={styles.emptyState}>
          <Ionicons name="tennisball-outline" size={64} color="#3A3A55" />
          <Text style={styles.emptyTitle}>Add a court first</Text>
          <Text style={styles.emptySubtitle}>
            Go to My Courts to add your venue
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Slot Management</Text>

      {/* Court Picker */}
      <FlatList
        horizontal
        data={courts}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        style={{ marginBottom: 16, maxHeight: 44 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.courtChip,
              selectedCourt?.id === item.id && styles.courtChipActive,
            ]}
            onPress={() => setSelectedCourt(item)}
          >
            <Text
              style={[
                styles.courtChipText,
                selectedCourt?.id === item.id && styles.courtChipTextActive,
              ]}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Date Picker */}
      <FlatList
        horizontal
        data={dates}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        style={{ marginBottom: 20, maxHeight: 44 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.dateChip,
              selectedDate === item && styles.dateChipActive,
            ]}
            onPress={() => setSelectedDate(item)}
          >
            <Text
              style={[
                styles.dateChipText,
                selectedDate === item && styles.dateChipTextActive,
              ]}
            >
              {item.slice(5)} {/* Shows MM-DD */}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Generate Slots Button */}
      <TouchableOpacity
        style={styles.generateButton}
        onPress={handleGenerateSlots}
        disabled={generating}
      >
        {generating ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            <Ionicons name="flash" size={20} color="#FFF" />
            <Text style={styles.generateText}>Generate Slots</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Existing Slots */}
      <Text style={styles.sectionTitle}>
        Existing Slots ({existingSlots.length})
      </Text>
      <FlatList
        data={existingSlots.sort((a, b) => a.time.localeCompare(b.time))}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={styles.slotRow}>
            <Text style={styles.slotTime}>{item.time}</Text>
            <View style={styles.slotRight}>
              <Text style={styles.slotPrice}>
                LKR {item.price?.toLocaleString()}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  item.isBooked ? styles.bookedBadge : styles.availableBadge,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    item.isBooked ? styles.bookedText : styles.availableText,
                  ]}
                >
                  {item.isBooked ? "Booked" : "Open"}
                </Text>
              </View>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1A1A2E", padding: 20 },
  header: { fontSize: 28, fontWeight: "700", color: "#FFF", marginBottom: 20 },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#FFF" },
  emptySubtitle: { color: "#8888AA", fontSize: 15 },
  courtChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#2A2A42",
    marginRight: 10,
  },
  courtChipActive: { backgroundColor: "#E46A41" },
  courtChipText: { color: "#8888AA", fontWeight: "600" },
  courtChipTextActive: { color: "#FFF" },
  dateChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#2A2A42",
    marginRight: 8,
  },
  dateChipActive: { backgroundColor: "#E46A41" },
  dateChipText: { color: "#8888AA", fontWeight: "600", fontSize: 13 },
  dateChipTextActive: { color: "#FFF" },
  generateButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 24,
  },
  generateText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 12,
  },
  slotRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#2A2A42",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  slotTime: { color: "#FFF", fontWeight: "600", fontSize: 15 },
  slotRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  slotPrice: { color: "#8888AA", fontSize: 13 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  bookedBadge: { backgroundColor: "rgba(255,82,82,0.15)" },
  availableBadge: { backgroundColor: "rgba(76,175,80,0.15)" },
  statusText: { fontSize: 12, fontWeight: "700" },
  bookedText: { color: "#FF5252" },
  availableText: { color: "#4CAF50" },
});
