import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { api, setToken, clearToken, isLoggedIn } from "./api";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  zoneId: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (data: { name: string; email: string; phone: string; password: string; zoneId: string }) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoggedIn()) {
      api.me().then((res) => {
        if (res.success && res.data) {
          setUser(res.data);
        } else {
          clearToken();
        }
        setLoading(false);
      }).catch(() => {
        clearToken();
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    if (res.success && res.data) {
      setToken(res.data.token);
      setUser(res.data.user as User);
      return { success: true, message: res.message };
    }
    return { success: false, message: res.message };
  };

  const register = async (data: { name: string; email: string; phone: string; password: string; zoneId: string }) => {
    const res = await api.register(data);
    if (res.success) {
      return { success: true, message: res.message };
    }
    return { success: false, message: res.message };
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
