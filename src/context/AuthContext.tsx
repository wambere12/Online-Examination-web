import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile, UserRole, University } from '../types/index.ts';
import { api, getStoredToken } from '../lib/api.ts';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  universities: University[];
  activeUniversity: University | null;
  isLoading: boolean;
  login: (email: string, password?: string, role?: string) => Promise<void>;
  switchDemoRole: (role: UserRole) => Promise<void>;
  setActiveUniversity: (uni: University) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  // aliases
  schools: University[];
  activeSchool: University | null;
  setActiveSchool: (uni: University) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [universities, setUniversities] = useState<University[]>([]);
  const [activeUniversity, setActiveUniversityState] = useState<University | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function init() {
      try {
        setIsLoading(true);
        const stored = getStoredToken();
        if (stored) {
          const { user } = await api.getCurrentUser();
          setUser(user);
        } else {
          // Default to lecturer for initial preview
          const data = await api.login({ role: 'lecturer' });
          setUser(data.user);
          setToken(data.token);
        }

        const uniRes = await api.getUniversities();
        setUniversities(uniRes.universities);
        if (uniRes.universities.length > 0) {
          setActiveUniversityState(uniRes.universities[0]);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, []);

  const login = async (email: string, password = 'Password123!', role?: string) => {
    setIsLoading(true);
    try {
      const data = await api.login({ email, password, role });
      setUser(data.user);
      setToken(data.token);
      const uniRes = await api.getUniversities();
      setUniversities(uniRes.universities);
      const userUni = uniRes.universities.find((u) => u.id === data.user.universityId) || uniRes.universities[0];
      setActiveUniversityState(userUni);
    } finally {
      setIsLoading(false);
    }
  };

  const switchDemoRole = async (role: UserRole) => {
    setIsLoading(true);
    try {
      const data = await api.login({ role });
      setUser(data.user);
      setToken(data.token);
      const uniRes = await api.getUniversities();
      setUniversities(uniRes.universities);
      const userUni = uniRes.universities.find((u) => u.id === data.user.universityId) || uniRes.universities[0];
      setActiveUniversityState(userUni);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.logout();
    setUser(null);
    setToken(null);
  };

  const refreshUser = async () => {
    try {
      const { user } = await api.getCurrentUser();
      setUser(user);
    } catch (e) {
      console.error(e);
    }
  };

  const setActiveUniversity = (uni: University) => {
    setActiveUniversityState(uni);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        universities,
        activeUniversity,
        isLoading,
        login,
        switchDemoRole,
        setActiveUniversity,
        logout,
        refreshUser,
        schools: universities,
        activeSchool: activeUniversity,
        setActiveSchool: setActiveUniversity,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
