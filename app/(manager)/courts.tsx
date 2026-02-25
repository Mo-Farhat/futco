import { Ionicons } from "@expo/vector-icons";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    updateDoc,
    where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../lib/firebaseConfig";

export default function ManagerCourtsScreen() {
  const { user } = useAuth();
  const [courts, setCourts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCourtId, setEditingCourtId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    sport: "Futsal",
    location: "",
    price: "",
    description: "",
  });

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "Courts"),
      where("managerId", "==", user.uid),
    );
    const unsub = onSnapshot(q, (snap) => {
      setCourts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [user]);

  const handleSaveCourt = async () => {
    if (!form.name || !form.location || !form.price) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }
    try {
      const courtData = {
        managerId: user!.uid,
        name: form.name,
        sport: form.sport.toLowerCase(),
        location: form.location,
        price: parseInt(form.price, 10),
        description: form.description,
        tags: [form.sport],
        updatedAt: new Date().toISOString(),
      };

      if (isEditing && editingCourtId) {
        await updateDoc(doc(db, "Courts", editingCourtId), courtData);
      } else {
        await addDoc(collection(db, "Courts"), {
          ...courtData,
          image:
            "https://images.unsplash.com/photo-1626224583764-84786c71971d?q=80&w=2070&auto=format&fit=crop",
          rating: 0,
          reviews: 0,
          distance: "",
          amenities: [],
          openTime: "09:00",
          closeTime: "21:00",
          createdAt: new Date().toISOString(),
        });
      }
      resetForm();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setIsEditing(false);
    setEditingCourtId(null);
    setForm({
      name: "",
      sport: "Futsal",
      location: "",
      price: "",
      description: "",
    });
  };

  const handleEditPress = (court: any) => {
    setForm({
      name: court.name,
      sport: court.sport.charAt(0).toUpperCase() + court.sport.slice(1),
      location: court.location,
      price: court.price.toString(),
      description: court.description || "",
    });
    setEditingCourtId(court.id);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDeleteCourt = (courtId: string, courtName: string) => {
    Alert.alert(
      "Delete Court",
      `Are you sure you want to delete "${courtName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteDoc(doc(db, "Courts", courtId)),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>My Courts</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setIsEditing(false);
            setShowForm(true);
          }}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {courts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="tennisball-outline" size={64} color="#2B4035" />
          <Text style={styles.emptyTitle}>No courts yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap + to add your first court
          </Text>
        </View>
      ) : (
        <FlatList
          data={courts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <View style={styles.courtCard}>
              <View style={styles.courtHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.courtName}>{item.name}</Text>
                  <Text style={styles.courtSport}>{item.sport}</Text>
                </View>
                <View style={{ flexDirection: "row", gap: 15 }}>
                  <TouchableOpacity onPress={() => handleEditPress(item)}>
                    <Ionicons name="pencil-outline" size={20} color="#7A9E87" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteCourt(item.id, item.name)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#FF5252" />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.courtLocation}>📍 {item.location}</Text>
              <Text style={styles.courtPrice}>
                LKR {item.price?.toLocaleString()} / hour
              </Text>
            </View>
          )}
        />
      )}

      {/* Add/Edit Court Modal */}
      <Modal visible={showForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditing ? "Edit Court" : "Add Court"}
              </Text>
              <TouchableOpacity onPress={resetForm}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Court Name"
              placeholderTextColor="#7A9E87"
              value={form.name}
              onChangeText={(v) => setForm({ ...form, name: v })}
            />
            <View style={styles.sportPicker}>
              {["Futsal", "Badminton", "Tennis"].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.sportChip,
                    form.sport === s && styles.sportChipActive,
                  ]}
                  onPress={() => setForm({ ...form, sport: s })}
                >
                  <Text
                    style={[
                      styles.sportChipText,
                      form.sport === s && styles.sportChipTextActive,
                    ]}
                  >
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Location"
              placeholderTextColor="#7A9E87"
              value={form.location}
              onChangeText={(v) => setForm({ ...form, location: v })}
            />
            <TextInput
              style={styles.input}
              placeholder="Price per Hour (LKR)"
              placeholderTextColor="#7A9E87"
              value={form.price}
              onChangeText={(v) => setForm({ ...form, price: v })}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Description"
              placeholderTextColor="#7A9E87"
              value={form.description}
              onChangeText={(v) => setForm({ ...form, description: v })}
              multiline
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSaveCourt}
            >
              <Text style={styles.submitText}>
                {isEditing ? "Save Changes" : "Add Court"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D1B14", padding: 20 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  header: { fontSize: 28, fontWeight: "700", color: "#FFF" },
  addButton: {
    backgroundColor: "#2D8B4E",
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#FFF" },
  emptySubtitle: { color: "#7A9E87", fontSize: 15 },
  courtCard: {
    backgroundColor: "#1A2E22",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  courtHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  courtName: { fontSize: 17, fontWeight: "700", color: "#FFF" },
  courtSport: {
    fontSize: 12,
    color: "#2D8B4E",
    fontWeight: "600",
    textTransform: "uppercase",
    marginTop: 2,
  },
  courtLocation: { color: "#7A9E87", fontSize: 14, marginBottom: 4 },
  courtPrice: { color: "#FFF", fontWeight: "600", fontSize: 15 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#0D1B14",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: { fontSize: 22, fontWeight: "700", color: "#FFF" },
  input: {
    backgroundColor: "#1A2E22",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#FFF",
    borderWidth: 1,
    borderColor: "#2B4035",
    marginBottom: 12,
  },
  sportPicker: { flexDirection: "row", gap: 10, marginBottom: 12 },
  sportChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#1A2E22",
    borderWidth: 1,
    borderColor: "#2B4035",
  },
  sportChipActive: { backgroundColor: "#2D8B4E", borderColor: "#2D8B4E" },
  sportChipText: { color: "#7A9E87", fontWeight: "600" },
  sportChipTextActive: { color: "#FFF" },
  submitButton: {
    backgroundColor: "#2D8B4E",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  submitText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
});
