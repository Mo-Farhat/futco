import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../lib/firebaseConfig";

type UserRole = "player" | "manager" | null;

interface AuthContextType {
  user: User | null;
  role: UserRole;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          // Check if user is a manager first
          const managerDoc = await getDoc(
            doc(db, "Managers", firebaseUser.uid),
          );
          if (managerDoc.exists()) {
            setRole("manager");
          } else {
            // Check Users collection, default to player
            const userDoc = await getDoc(doc(db, "Users", firebaseUser.uid));
            if (userDoc.exists()) {
              setRole(userDoc.data().role as UserRole);
            } else {
              setRole("player");
            }
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setRole("player");
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
