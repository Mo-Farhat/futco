import { Ionicons } from "@expo/vector-icons";
import {
    addDoc,
    collection,
    getDocs,
    onSnapshot,
    query,
    where,
} from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../lib/firebaseConfig";

// --- Helpers ---

function generateTimeSlots(startHour: number, endHour: number): string[] {
  const slots: string[] = [];
  let h = startHour;
  while (h < endHour) {
    const start = `${String(h).padStart(2, "0")}:00`;
    const end = `${String(h + 1).padStart(2, "0")}:00`;
    slots.push(`${start} - ${end}`);
    h++;
  }
  return slots;
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const HOUR_OPTIONS = Array.from({ length: 19 }, (_, i) => i + 5); // 5 AM to 11 PM

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (Date | null)[] = [];

  // Leading blanks
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));

  return days;
}

// --- Component ---

export default function ManagerSlotsScreen() {
  const { user } = useAuth();
  const [courts, setCourts] = useState<any[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<any>(null);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [startHour, setStartHour] = useState(6);
  const [endHour, setEndHour] = useState(22);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [existingSlots, setExistingSlots] = useState<any[]>([]);
  const [users, setUsers] = useState<Record<string, string>>({}); // uid -> displayName

  // Calendar navigation
  const today = new Date();
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());

  const calendarDays = useMemo(
    () => getCalendarDays(calYear, calMonth),
    [calYear, calMonth],
  );

  const todayStr = formatDate(today);

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
      if (data.length > 0 && !selectedCourt) setSelectedCourt(data[0]);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  // Fetch existing slots for selected court (current month view)
  useEffect(() => {
    if (!selectedCourt) return;
    const monthStart = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-01`;
    const monthEnd = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-31`;
    const q = query(
      collection(db, "Slots"),
      where("courtId", "==", selectedCourt.id),
      where("date", ">=", monthStart),
      where("date", "<=", monthEnd),
    );
    const unsub = onSnapshot(q, (snap) => {
      const slots = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setExistingSlots(slots);

      // Fetch user details for booked slots
      const uids = [
        ...new Set(
          slots.filter((s) => s.isBooked && s.userId).map((s) => s.userId),
        ),
      ];
      if (uids.length > 0) {
        fetchUserNames(uids);
      }
    });
    return unsub;
  }, [selectedCourt, calMonth, calYear]);

  const fetchUserNames = async (uids: string[]) => {
    try {
      // Small optimization: only fetch users we don't have yet
      const missing = uids.filter((id) => !users[id]);
      if (missing.length === 0) return;

      const userMap = { ...users };
      for (const uid of missing) {
        const userDoc = await getDocs(
          query(collection(db, "Users"), where("__name__", "==", uid)),
        );
        if (!userDoc.empty) {
          userMap[uid] = userDoc.docs[0].data().displayName || "Unknown Player";
        } else {
          userMap[uid] = "Deleted User";
        }
      }
      setUsers(userMap);
    } catch (e) {
      console.error("Error fetching user names:", e);
    }
  };

  // Count existing slots per date
  const slotCountByDate = useMemo(() => {
    const map: Record<string, number> = {};
    existingSlots.forEach((s) => {
      map[s.date] = (map[s.date] || 0) + 1;
    });
    return map;
  }, [existingSlots]);

  // Toggle date selection
  const toggleDate = (dateStr: string) => {
    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) next.delete(dateStr);
      else next.add(dateStr);
      return next;
    });
  };

  // Select all days in visible month (from today onwards)
  const selectAllMonth = () => {
    const newSet = new Set(selectedDates);
    calendarDays.forEach((d) => {
      if (d && formatDate(d) >= todayStr) {
        newSet.add(formatDate(d));
      }
    });
    setSelectedDates(newSet);
  };

  const clearSelection = () => setSelectedDates(new Set());

  // Navigate months
  const prevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(calYear - 1);
    } else setCalMonth(calMonth - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(calYear + 1);
    } else setCalMonth(calMonth + 1);
  };

  // Bulk generate
  const handleBulkGenerate = async () => {
    if (!selectedCourt || selectedDates.size === 0) {
      Alert.alert("Select Dates", "Please select at least one date.");
      return;
    }
    if (startHour >= endHour) {
      Alert.alert("Invalid Time", "Start time must be before end time.");
      return;
    }

    const timeSlots = generateTimeSlots(startHour, endHour);
    const dates = Array.from(selectedDates).sort();

    Alert.alert(
      "Generate Slots",
      `Create up to ${timeSlots.length} slot(s) × ${dates.length} day(s) = ${timeSlots.length * dates.length} slots?\n\nTime: ${String(startHour).padStart(2, "0")}:00 – ${String(endHour).padStart(2, "0")}:00`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Generate",
          onPress: async () => {
            setGenerating(true);
            let created = 0;
            let skipped = 0;

            try {
              for (const date of dates) {
                // Get existing slots for this date
                const existingSnap = await getDocs(
                  query(
                    collection(db, "Slots"),
                    where("courtId", "==", selectedCourt.id),
                    where("date", "==", date),
                  ),
                );
                const existingTimes = existingSnap.docs.map(
                  (d) => d.data().time,
                );

                const newSlots = timeSlots.filter(
                  (t) => !existingTimes.includes(t),
                );

                const promises = newSlots.map((time) =>
                  addDoc(collection(db, "Slots"), {
                    courtId: selectedCourt.id,
                    date,
                    time,
                    isBooked: false,
                    price: selectedCourt.price || 4000,
                  }),
                );

                await Promise.all(promises);
                created += newSlots.length;
                skipped += existingTimes.length;
              }

              Alert.alert(
                "Done!",
                `✅ ${created} slot(s) created${skipped > 0 ? `\n⏭ ${skipped} existing slot(s) skipped` : ""}`,
              );
              setSelectedDates(new Set());
            } catch (error: any) {
              Alert.alert("Error", error.message);
            } finally {
              setGenerating(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#2D8B4E" />
      </SafeAreaView>
    );
  }

  if (courts.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.header}>Slot Management</Text>
        <View style={styles.emptyState}>
          <Ionicons name="tennisball-outline" size={64} color="#2B4035" />
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
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>Slot Management</Text>

        {/* Court Picker */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 20, flexGrow: 0 }}
        >
          {courts.map((item) => (
            <TouchableOpacity
              key={item.id}
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
          ))}
        </ScrollView>

        {/* Calendar Header */}
        <View style={styles.calHeader}>
          <TouchableOpacity onPress={prevMonth}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.calTitle}>
            {MONTHS[calMonth]} {calYear}
          </Text>
          <TouchableOpacity onPress={nextMonth}>
            <Ionicons name="chevron-forward" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Day names row */}
        <View style={styles.dayNamesRow}>
          {DAYS.map((d) => (
            <Text key={d} style={styles.dayName}>
              {d}
            </Text>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calGrid}>
          {calendarDays.map((day, i) => {
            if (!day) {
              return <View key={`blank-${i}`} style={styles.calCell} />;
            }
            const dateStr = formatDate(day);
            const isPast = dateStr < todayStr;
            const isSelected = selectedDates.has(dateStr);
            const isToday = dateStr === todayStr;
            const slotCount = slotCountByDate[dateStr] || 0;

            return (
              <TouchableOpacity
                key={dateStr}
                style={[
                  styles.calCell,
                  isSelected && styles.calCellSelected,
                  isToday && !isSelected && styles.calCellToday,
                  isPast && styles.calCellPast,
                ]}
                onPress={() => !isPast && toggleDate(dateStr)}
                disabled={isPast}
              >
                <Text
                  style={[
                    styles.calDateText,
                    isSelected && styles.calDateTextSelected,
                    isPast && styles.calDateTextPast,
                  ]}
                >
                  {day.getDate()}
                </Text>
                {slotCount > 0 && (
                  <View style={styles.slotDot}>
                    <Text style={styles.slotDotText}>{slotCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickBtn} onPress={selectAllMonth}>
            <Ionicons name="checkbox-outline" size={16} color="#2D8B4E" />
            <Text style={styles.quickBtnText}>Select All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={clearSelection}>
            <Ionicons name="close-circle-outline" size={16} color="#7A9E87" />
            <Text style={[styles.quickBtnText, { color: "#7A9E87" }]}>
              Clear
            </Text>
          </TouchableOpacity>
          <Text style={styles.selectionCount}>
            {selectedDates.size} day{selectedDates.size !== 1 ? "s" : ""}{" "}
            selected
          </Text>
        </View>

        {/* Time Range */}
        <TouchableOpacity
          style={styles.timeRangeCard}
          onPress={() => setShowTimePicker(!showTimePicker)}
        >
          <View style={styles.timeRangeHeader}>
            <Ionicons name="time-outline" size={20} color="#2D8B4E" />
            <Text style={styles.timeRangeTitle}>Operating Hours</Text>
            <Ionicons
              name={showTimePicker ? "chevron-up" : "chevron-down"}
              size={20}
              color="#7A9E87"
            />
          </View>
          <Text style={styles.timeRangeValue}>
            {String(startHour).padStart(2, "0")}:00 –{" "}
            {String(endHour).padStart(2, "0")}:00
          </Text>
        </TouchableOpacity>

        {showTimePicker && (
          <View style={styles.timePickerContainer}>
            <Text style={styles.timePickerLabel}>Start Time</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 16 }}
            >
              {HOUR_OPTIONS.map((h) => (
                <TouchableOpacity
                  key={`start-${h}`}
                  style={[
                    styles.hourChip,
                    startHour === h && styles.hourChipActive,
                  ]}
                  onPress={() => setStartHour(h)}
                >
                  <Text
                    style={[
                      styles.hourChipText,
                      startHour === h && styles.hourChipTextActive,
                    ]}
                  >
                    {String(h).padStart(2, "0")}:00
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.timePickerLabel}>End Time</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {HOUR_OPTIONS.filter((h) => h > startHour).map((h) => (
                <TouchableOpacity
                  key={`end-${h}`}
                  style={[
                    styles.hourChip,
                    endHour === h && styles.hourChipActive,
                  ]}
                  onPress={() => setEndHour(h)}
                >
                  <Text
                    style={[
                      styles.hourChipText,
                      endHour === h && styles.hourChipTextActive,
                    ]}
                  >
                    {String(h).padStart(2, "0")}:00
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Generate Button */}
        <TouchableOpacity
          style={[
            styles.generateButton,
            (selectedDates.size === 0 || generating) &&
              styles.generateButtonDisabled,
          ]}
          onPress={handleBulkGenerate}
          disabled={selectedDates.size === 0 || generating}
        >
          {generating ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="flash" size={20} color="#FFF" />
              <Text style={styles.generateText}>
                Generate{" "}
                {selectedDates.size > 0
                  ? `${(endHour - startHour) * selectedDates.size} Slots`
                  : "Slots"}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Day Details / Management */}
        {selectedDates.size > 0 && (
          <View style={styles.dayDetails}>
            <Text style={styles.dayDetailsTitle}>
              Slots for {Array.from(selectedDates)[0]}
            </Text>
            {existingSlots
              .filter((s) => s.date === Array.from(selectedDates)[0])
              .sort((a, b) => a.time.localeCompare(b.time))
              .map((s) => (
                <View key={s.id} style={styles.slotCard}>
                  <View style={styles.slotInfo}>
                    <Text style={styles.slotTime}>{s.time}</Text>
                    {s.isBooked ? (
                      <View style={styles.bookedBadge}>
                        <Ionicons name="person" size={12} color="#4CAF50" />
                        <Text style={styles.bookedText}>
                          {users[s.userId] || "Loading..."}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.availableBadge}>
                        <Text style={styles.availableText}>Available</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.slotPrice}>LKR {s.price}</Text>
                </View>
              ))}
            {existingSlots.filter(
              (s) => s.date === Array.from(selectedDates)[0],
            ).length === 0 && (
              <Text style={styles.noSlotsText}>
                No slots created for this day.
              </Text>
            )}
          </View>
        )}

        {/* Summary of existing slots this month */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>This Month</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{existingSlots.length}</Text>
              <Text style={styles.summaryLabel}>Total Slots</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {existingSlots.filter((s) => !s.isBooked).length}
              </Text>
              <Text style={styles.summaryLabel}>Available</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {existingSlots.filter((s) => s.isBooked).length}
              </Text>
              <Text style={styles.summaryLabel}>Booked</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D1B14", padding: 20 },
  header: { fontSize: 28, fontWeight: "700", color: "#FFF", marginBottom: 20 },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#FFF" },
  emptySubtitle: { color: "#7A9E87", fontSize: 15 },
  courtChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#1A2E22",
    marginRight: 10,
  },
  courtChipActive: { backgroundColor: "#2D8B4E" },
  courtChipText: { color: "#7A9E87", fontWeight: "600" },
  courtChipTextActive: { color: "#FFF" },

  // Calendar
  calHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  calTitle: { fontSize: 18, fontWeight: "700", color: "#FFF" },
  dayNamesRow: { flexDirection: "row", marginBottom: 8 },
  dayName: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    color: "#7A9E87",
    fontWeight: "600",
  },
  calGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 16 },
  calCell: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  calCellSelected: { backgroundColor: "#2D8B4E", borderRadius: 12 },
  calCellToday: { borderWidth: 1, borderColor: "#2D8B4E", borderRadius: 12 },
  calCellPast: { opacity: 0.3 },
  calDateText: { fontSize: 15, color: "#FFF", fontWeight: "500" },
  calDateTextSelected: { color: "#FFF", fontWeight: "700" },
  calDateTextPast: { color: "#555" },
  slotDot: {
    position: "absolute",
    bottom: 4,
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    paddingHorizontal: 4,
    minWidth: 16,
    alignItems: "center",
  },
  slotDotText: { color: "#FFF", fontSize: 9, fontWeight: "700" },

  // Quick actions
  quickActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  quickBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#1A2E22",
  },
  quickBtnText: { color: "#2D8B4E", fontSize: 13, fontWeight: "600" },
  selectionCount: {
    color: "#7A9E87",
    fontSize: 13,
    marginLeft: "auto",
  },

  // Time range
  timeRangeCard: {
    backgroundColor: "#1A2E22",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  timeRangeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  timeRangeTitle: { flex: 1, color: "#FFF", fontWeight: "600", fontSize: 15 },
  timeRangeValue: { color: "#2D8B4E", fontWeight: "700", fontSize: 18 },
  timePickerContainer: {
    backgroundColor: "#1A2E22",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  timePickerLabel: {
    color: "#7A9E87",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  hourChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#0D1B14",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#2B4035",
  },
  hourChipActive: { backgroundColor: "#2D8B4E", borderColor: "#2D8B4E" },
  hourChipText: { color: "#7A9E87", fontWeight: "600", fontSize: 13 },
  hourChipTextActive: { color: "#FFF" },

  // Generate
  generateButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 14,
    gap: 8,
    marginBottom: 24,
  },
  generateButtonDisabled: { opacity: 0.5 },
  generateText: { color: "#FFF", fontSize: 16, fontWeight: "700" },

  // Summary
  summaryCard: {
    backgroundColor: "#1A2E22",
    borderRadius: 14,
    padding: 20,
    marginBottom: 40,
  },
  summaryTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-around" },
  summaryItem: { alignItems: "center" },
  summaryValue: { color: "#FFF", fontSize: 24, fontWeight: "700" },
  summaryLabel: { color: "#7A9E87", fontSize: 12, marginTop: 4 },

  // Day Details
  dayDetails: { marginBottom: 24 },
  dayDetailsTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  slotCard: {
    backgroundColor: "#1A2E22",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#2B4035",
  },
  slotInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  slotTime: { color: "#FFF", fontSize: 15, fontWeight: "600" },
  bookedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(76,175,80,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bookedText: { color: "#4CAF50", fontSize: 12, fontWeight: "600" },
  availableBadge: {
    backgroundColor: "rgba(122,158,135,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  availableText: { color: "#7A9E87", fontSize: 12, fontWeight: "600" },
  slotPrice: { color: "#7A9E87", fontSize: 14 },
  noSlotsText: { color: "#7A9E87", fontStyle: "italic", textAlign: "center" },
});
