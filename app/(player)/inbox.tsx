import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MOCK_NOTIFICATIONS = [
  {
    id: "1",
    title: "Booking Confirmed",
    message: "Your booking at Arena 7 is confirmed for tomorrow at 6:00 PM.",
    time: "2h ago",
    icon: "checkmark-circle",
    type: "success",
  },
  {
    id: "2",
    title: "Court Opening",
    message: "New court 'The Cage' just opened in Colombo 07. Check it out!",
    time: "5h ago",
    icon: "megaphone",
    type: "info",
  },
  {
    id: "3",
    title: "Payment Success",
    message: "Payment of LKR 4,000 for Slot #B482 was successful.",
    time: "1d ago",
    icon: "receipt",
    type: "success",
  },
];

export default function InboxScreen() {
  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.notificationCard}>
      <View style={[styles.iconContainer, (styles as any)[`${item.type}Icon`]]}>
        <Ionicons name={item.icon as any} size={24} color="#FFF" />
      </View>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.notifTitle}>{item.title}</Text>
          <Text style={styles.timeText}>{item.time}</Text>
        </View>
        <Text style={styles.messageText}>{item.message}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Inbox</Text>
      {MOCK_NOTIFICATIONS.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="mail-unread-outline" size={64} color="#7A9E87" />
          <Text style={styles.emptyText}>Your inbox is empty</Text>
        </View>
      ) : (
        <FlatList
          data={MOCK_NOTIFICATIONS}
          renderItem={renderItem}
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
  notificationCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  successIcon: { backgroundColor: "#2D8B4E" },
  infoIcon: { backgroundColor: "#2196F3" },
  content: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  notifTitle: { fontSize: 16, fontWeight: "700", color: "#1F1F1F" },
  timeText: { fontSize: 12, color: "#888" },
  messageText: { fontSize: 14, color: "#666", lineHeight: 20 },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
  },
  emptyText: { marginTop: 16, fontSize: 16, color: "#7A9E87" },
});
