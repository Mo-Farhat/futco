import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { auth, db } from "../../lib/firebaseConfig";

export default function ManagerLoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();

  const handleAuth = async () => {
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        if (!businessName.trim()) {
          Alert.alert("Error", "Please enter your business name.");
          return;
        }
        const cred = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        await setDoc(doc(db, "Managers", cred.user.uid), {
          email: cred.user.email,
          businessName: businessName.trim(),
          phone: "",
          subscriptionTier: "free",
          createdAt: new Date().toISOString(),
        });
      }
    } catch (error: any) {
      Alert.alert("Authentication Error", error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar style="dark" />
      <View style={styles.content}>
        {/* Badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>MANAGER PORTAL</Text>
        </View>

        <Text style={styles.title}>
          {isLogin ? "Manager Login" : "Register Your Venue"}
        </Text>
        <Text style={styles.subtitle}>
          {isLogin
            ? "Access your court management dashboard"
            : "Create a manager account to list your courts"}
        </Text>

        <View style={styles.inputContainer}>
          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="Business Name"
              placeholderTextColor="#A0A0A0"
              value={businessName}
              onChangeText={setBusinessName}
            />
          )}
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#A0A0A0"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#A0A0A0"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleAuth}>
          <Text style={styles.buttonText}>
            {isLogin ? "Log In" : "Create Account"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setIsLogin(!isLogin)}
          style={styles.toggleButton}
        >
          <Text style={styles.toggleText}>
            {isLogin
              ? "New venue? Register here"
              : "Already registered? Log In"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace("/(player)")}
        >
          <Text style={styles.backText}>← Back to Player App</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D1B14" },
  content: { flex: 1, justifyContent: "center", padding: 24 },
  badge: {
    backgroundColor: "rgba(45,139,78,0.15)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  badgeText: {
    color: "#2D8B4E",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  title: { fontSize: 32, fontWeight: "700", color: "#FFF", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#7A9E87", marginBottom: 32 },
  inputContainer: { gap: 16, marginBottom: 32 },
  input: {
    backgroundColor: "#1A2E22",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#FFF",
    borderWidth: 1,
    borderColor: "#2B4035",
  },
  button: {
    backgroundColor: "#2D8B4E",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  toggleButton: { alignItems: "center", marginBottom: 24 },
  toggleText: { color: "#7A9E87", fontSize: 14 },
  backButton: { alignItems: "center" },
  backText: { color: "#2D8B4E", fontSize: 14, fontWeight: "500" },
});
