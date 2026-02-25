import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { Court, useCourts } from "../../hooks/useCourts";

const CATEGORIES = ["All", "Futsal", "Badminton", "Tennis"];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function getFormattedDate(): string {
  const days = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];
  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  const now = new Date();
  return `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;
}

export default function DiscoveryScreen() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const { user } = useAuth();
  const { courts: firestoreCourts, loading } = useCourts();

  // Use Firestore courts directly — no fallback to hardcoded data
  const courts = firestoreCourts;

  // Filter by category and search query
  const filteredCourts = useMemo(() => {
    return courts.filter((court) => {
      const matchesCategory =
        selectedCategory === "All" ||
        court.tags?.some((tag) =>
          tag.toLowerCase().includes(selectedCategory.toLowerCase()),
        ) ||
        court.sport?.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        court.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [courts, selectedCategory, searchQuery]);

  // Dynamic greeting and user info
  const greeting = getGreeting();
  const dateText = getFormattedDate();
  const firstName = user?.displayName?.split(" ")[0] || "";
  const initial = firstName ? firstName[0].toUpperCase() : null;

  const renderCourtCard = (item: Court) => (
    <TouchableOpacity
      key={item.id}
      style={styles.card}
      onPress={() => router.push(`/court/${item.id}`)}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.image }}
          style={styles.cardImage}
          resizeMode="cover"
        />
      </View>
      <View style={styles.cardContent}>
        <View style={styles.tagRow}>
          {item.tags?.map((tag, i) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.courtName}>{item.name}</Text>
        <View style={styles.courtMeta}>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color="#2D8B4E" />
            <Text style={styles.ratingText}>{item.rating || "New"}</Text>
          </View>
          <Text style={styles.distanceText}>
            {item.distance || item.location}
          </Text>
        </View>
        <Text style={styles.price}>
          LKR {item.price?.toLocaleString()}
          <Text style={styles.perHour}> / hour</Text>
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.dateText}>{dateText}</Text>
          <Text style={styles.greeting}>
            {greeting}
            {firstName ? `, ${firstName}` : ""}
          </Text>
        </View>
        {user && initial ? (
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.loginChip}
            onPress={() => router.push("/(auth)/login")}
          >
            <Ionicons name="person-outline" size={16} color="#2D8B4E" />
            <Text style={styles.loginChipText}>Log In</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={20}
          color="#888"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Find a court, field, or gym..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={20} color="#1F1F1F" />
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <View style={{ marginBottom: 24 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 20 }}
        >
          {CATEGORIES.map((cat, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.categoryChip,
                selectedCategory === cat && styles.activeCategoryChip,
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              {cat === "Tennis" && (
                <Ionicons
                  name="tennisball-outline"
                  size={16}
                  color={selectedCategory === cat ? "#FFF" : "#666"}
                  style={{ marginRight: 6 }}
                />
              )}
              {cat === "Futsal" && (
                <Ionicons
                  name="football-outline"
                  size={16}
                  color={selectedCategory === cat ? "#FFF" : "#666"}
                  style={{ marginRight: 6 }}
                />
              )}
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === cat && styles.activeCategoryText,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Courts</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View all</Text>
          </TouchableOpacity>
        </View>

        {/* Court Cards */}
        {loading && firestoreCourts.length === 0 ? (
          <ActivityIndicator
            size="large"
            color="#2D8B4E"
            style={{ marginTop: 40 }}
          />
        ) : filteredCourts.length === 0 ? (
          <Text
            style={{
              textAlign: "center",
              color: "#999",
              marginTop: 40,
              fontSize: 16,
            }}
          >
            No courts found
          </Text>
        ) : (
          filteredCourts.map((item) => renderCourtCard(item))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F7F2", paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  dateText: {
    fontSize: 13,
    color: "#888",
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  greeting: { fontSize: 24, fontWeight: "700", color: "#1F1F1F" },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2D8B4E",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { color: "#FFF", fontSize: 18, fontWeight: "700" },
  loginChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2D8B4E",
  },
  loginChipText: { color: "#2D8B4E", fontWeight: "600", fontSize: 13 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: "#1F1F1F" },
  filterButton: { padding: 4 },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  activeCategoryChip: { backgroundColor: "#2D8B4E", borderColor: "#2D8B4E" },
  categoryText: { fontSize: 14, fontWeight: "600", color: "#666" },
  activeCategoryText: { color: "#FFFFFF" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 20, fontWeight: "600", color: "#1F1F1F" },
  viewAll: { fontSize: 14, color: "#2D8B4E", fontWeight: "600" },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    marginBottom: 20,
  },
  imageContainer: { height: 180, width: "100%", position: "relative" },
  cardImage: { width: "100%", height: "100%", resizeMode: "cover" },
  cardContent: { padding: 16 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  tag: {
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: { fontSize: 12, color: "#666", fontWeight: "500" },
  courtName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F1F1F",
    marginBottom: 8,
  },
  courtMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: { fontSize: 13, fontWeight: "700", color: "#1F1F1F" },
  distanceText: { fontSize: 14, color: "#888" },
  price: { fontSize: 18, fontWeight: "700", color: "#2D8B4E" },
  perHour: { fontSize: 12, color: "#888", fontWeight: "400" },
});
