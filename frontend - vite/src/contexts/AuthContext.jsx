import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

const STORAGE_KEY = "saferoute_user";
const USERS_KEY = "saferoute_users";

// Demo / seed accounts that always work
const SEED_USERS = [
  {
    id: "demo1",
    name: "Demo User",
    email: "demo@saferoute.ai",
    password: "demo1234",
    travelerType: "standard",
    createdAt: "2026-01-01",
    avatar: null,
  },
];

function getStoredUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    const stored = raw ? JSON.parse(raw) : [];
    // Merge seed users (don't duplicate)
    const emails = stored.map((u) => u.email);
    const merged = [...stored, ...SEED_USERS.filter((u) => !emails.includes(u.email))];
    return merged;
  } catch {
    return SEED_USERS;
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const login = async (email, password, remember = true) => {
    setLoading(true);
    setError(null);
    await new Promise((r) => setTimeout(r, 800)); // Simulate network delay

    const users = getStoredUsers();
    const found = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!found) {
      setError("Invalid email or password.");
      setLoading(false);
      return false;
    }

    const { password: _pw, ...safeUser } = found;
    setUser(safeUser);
    if (!remember) {
      // Session-only: will be cleared on tab close via sessionStorage trick
      sessionStorage.setItem("session_only", "1");
    }
    setLoading(false);
    return true;
  };

  const signup = async ({ name, email, password, travelerType }) => {
    setLoading(true);
    setError(null);
    await new Promise((r) => setTimeout(r, 1000));

    const users = getStoredUsers();
    if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
      setError("An account with this email already exists.");
      setLoading(false);
      return false;
    }

    const newUser = {
      id: `user_${Date.now()}`,
      name,
      email,
      password,
      travelerType: travelerType || "standard",
      createdAt: new Date().toISOString().split("T")[0],
      avatar: null,
    };

    saveUsers([...users, newUser]);
    const { password: _pw, ...safeUser } = newUser;
    setUser(safeUser);
    setLoading(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    setError(null);
    sessionStorage.removeItem("session_only");
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, signup, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
