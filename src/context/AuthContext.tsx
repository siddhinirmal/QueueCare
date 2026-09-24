import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { isFirebaseConfigured, requireAuth, requireDb } from "../firebase";
import type { UserProfile, UserRole } from "../types";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  configured: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  signup: (
    name: string,
    email: string,
    password: string,
    role: UserRole
  ) => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function emptyProfile(name: string, email: string, role: UserRole): Omit<UserProfile, "id"> {
  return {
    role,
    name,
    email,
    phone: "",
    degree: "",
    specialization: "",
    experience: "",
    age: "",
    bloodGroup: "",
    allergies: "",
  };
}

function toProfile(id: string, data: Record<string, unknown>): UserProfile {
  return {
    id,
    role: data.role === "doctor" ? "doctor" : "patient",
    name: String(data.name ?? ""),
    email: String(data.email ?? ""),
    phone: String(data.phone ?? ""),
    degree: String(data.degree ?? ""),
    specialization: String(data.specialization ?? ""),
    experience: String(data.experience ?? ""),
    age: String(data.age ?? ""),
    bloodGroup: String(data.bloodGroup ?? ""),
    allergies: String(data.allergies ?? ""),
  };
}

async function loadProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(requireDb(), "users", uid));
  if (!snap.exists()) return null;
  return toProfile(snap.id, snap.data());
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(requireAuth(), async (nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        setProfile(await loadProfile(nextUser.uid));
      } catch (error) {
        console.error("Failed to load user profile", error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      configured: isFirebaseConfigured,
      async login(email, password) {
        const cred = await signInWithEmailAndPassword(requireAuth(), email, password);
        const nextProfile = await loadProfile(cred.user.uid);
        if (!nextProfile) {
          await signOut(requireAuth());
          throw new Error("No QueueCare profile found for this account.");
        }
        setUser(cred.user);
        setProfile(nextProfile);
        return nextProfile;
      },
      async signup(name, email, password, role) {
        const cred = await createUserWithEmailAndPassword(requireAuth(), email, password);
        const payload = emptyProfile(name.trim(), email.trim(), role);
        await setDoc(doc(requireDb(), "users", cred.user.uid), payload);
        const nextProfile = { id: cred.user.uid, ...payload };
        setUser(cred.user);
        setProfile(nextProfile);
        return nextProfile;
      },
      async logout() {
        await signOut(requireAuth());
        setUser(null);
        setProfile(null);
      },
      async refreshProfile() {
        const current = requireAuth().currentUser;
        if (!current) return;
        setProfile(await loadProfile(current.uid));
      },
    }),
    [user, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
