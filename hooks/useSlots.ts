import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../lib/firebaseConfig";

export interface Slot {
  id: string;
  courtId: string;
  date: string;
  time: string;
  isBooked: boolean;
  price: number;
}

interface GroupedSlots {
  morning: Slot[];
  afternoon: Slot[];
  evening: Slot[];
}

function getTimeOfDay(time: string): "morning" | "afternoon" | "evening" {
  const hour = parseInt(time.split(":")[0], 10);
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export function useSlots(courtId: string, date: string) {
  const [slots, setSlots] = useState<GroupedSlots>({
    morning: [],
    afternoon: [],
    evening: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courtId || !date) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      collection(db, "Slots"),
      where("courtId", "==", courtId),
      where("date", "==", date),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const allSlots = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Slot[];

        // Sort by time
        allSlots.sort((a, b) => a.time.localeCompare(b.time));

        // Group by time of day
        const grouped: GroupedSlots = {
          morning: [],
          afternoon: [],
          evening: [],
        };

        allSlots.forEach((slot) => {
          const period = getTimeOfDay(slot.time);
          grouped[period].push(slot);
        });

        setSlots(grouped);
        setLoading(false);
      },
      (err) => {
        console.error("Slots listener error:", err);
        setError(err.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [courtId, date]);

  return { slots, loading, error };
}
