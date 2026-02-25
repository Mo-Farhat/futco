import { collection, onSnapshot, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../lib/firebaseConfig";

export interface Court {
  id: string;
  managerId?: string;
  name: string;
  sport: string;
  location: string;
  image: string;
  price: number;
  rating: number;
  reviews: number;
  distance: string;
  tags: string[];
  description: string;
  amenities: string[];
  openTime?: string;
  closeTime?: string;
}

export function useCourts() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "Courts"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Court[];
        setCourts(data);
        setLoading(false);
      },
      (err) => {
        console.error("Courts listener error:", err);
        setError(err.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  return { courts, loading, error };
}
