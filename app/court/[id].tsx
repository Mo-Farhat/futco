import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { FEATURED_COURTS } from "../../constants/data";
import { useCourts } from "../../hooks/useCourts";

export default function CourtDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { courts: firestoreCourts, loading } = useCourts();

  // Try Firestore first, then fall back to local data
  const court =
    firestoreCourts.find((c) => c.id === id) ||
    FEATURED_COURTS.find((c) => c.id === id);

  if (loading && !court) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#E46A41" />
      </View>
    );
  }

  if (!court) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <Ionicons name="tennisball-outline" size={64} color="#CCC" />
        <Text style={{ color: "#999", fontSize: 18, marginTop: 16 }}>
          Court not found
        </Text>
        <TouchableOpacity
          style={{
            marginTop: 20,
            padding: 12,
            backgroundColor: "#E46A41",
            borderRadius: 10,
          }}
          onPress={() => router.back()}
        >
          <Text style={{ color: "#FFF", fontWeight: "600" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Image Header */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: court.image }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="heart-outline" size={24} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="share-social-outline" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.contentContainer}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={styles.pillContainer}>
          <View style={styles.openPill}>
            <Text style={styles.openText}>OPEN NOW</Text>
          </View>
          <View style={styles.ratingPill}>
            <Ionicons name="star" size={14} color="#E46A41" />
            <Text style={styles.ratingText}>
              {court.rating} ({court.reviews} reviews)
            </Text>
          </View>
        </View>

        <Text style={styles.title}>{court.name}</Text>

        <View style={styles.locationContainer}>
          <View style={styles.locationIconBg}>
            <Ionicons name="location" size={20} color="#E46A41" />
          </View>
          <View>
            <Text style={styles.locationText}>{court.location}</Text>
            <Text style={styles.distanceText}>{court.distance}</Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color="#CCC"
            style={{ marginLeft: "auto" }}
          />
        </View>

        <Text style={styles.sectionTitle}>Amenities</Text>
        <View style={styles.amenitiesGrid}>
          {court.amenities.map((amenity, index) => (
            <View key={index} style={styles.amenityItem}>
              <View style={styles.amenityIcon}>
                <Ionicons
                  name={getAmenityIcon(amenity)}
                  size={24}
                  color="#666"
                />
              </View>
              <Text style={styles.amenityText}>{amenity}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>About this venue</Text>
        <Text style={styles.description}>{court.description}</Text>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.priceLabel}>PRICE</Text>
          <Text style={styles.priceValue}>
            LKR {court.price}
            <Text style={styles.perHour}> / hour</Text>
          </Text>
        </View>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => router.push(`/court/${id}/slots`)}
        >
          <Text style={styles.bookButtonText}>Select Date</Text>
          <Ionicons
            name="calendar-outline"
            size={20}
            color="#FFF"
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function getAmenityIcon(amenity: string): any {
  switch (amenity.toLowerCase()) {
    case "wifi":
      return "wifi";
    case "showers":
      return "water";
    case "parking":
      return "car";
    case "lockers":
      return "key";
    case "water":
      return "water-outline";
    default:
      return "checkmark-circle-outline";
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  imageContainer: { height: 300, width: "100%", position: "relative" },
  image: { width: "100%", height: "100%" },
  headerButtons: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  contentContainer: {
    flex: 1,
    marginTop: -30,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    paddingTop: 32,
  },
  pillContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 10,
  },
  openPill: {
    backgroundColor: "#E6F4EA",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  openText: { color: "#1E8E3E", fontSize: 12, fontWeight: "700" },
  ratingPill: { flexDirection: "row", alignItems: "center" },
  ratingText: { marginLeft: 4, color: "#666", fontSize: 13, fontWeight: "500" },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1F1F1F",
    marginBottom: 20,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  locationIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FDF1EE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  locationText: { fontSize: 16, fontWeight: "600", color: "#1F1F1F" },
  distanceText: { fontSize: 14, color: "#888" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F1F1F",
    marginBottom: 16,
  },
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
    marginBottom: 30,
  },
  amenityItem: { alignItems: "center" },
  amenityIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  amenityText: { fontSize: 12, color: "#666" },
  description: {
    fontSize: 15,
    color: "#666",
    lineHeight: 24,
    marginBottom: 20,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  priceLabel: {
    fontSize: 12,
    color: "#888",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  priceValue: { fontSize: 24, fontWeight: "700", color: "#1F1F1F" },
  perHour: { fontSize: 14, color: "#888", fontWeight: "400" },
  bookButton: {
    backgroundColor: "#E46A41",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
  },
  bookButtonText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});
