import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types/database.types';

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (name: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for logged in user in localStorage
    const savedUser = localStorage.getItem('expense_app_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Failed to parse saved user:', error);
        localStorage.removeItem('expense_app_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (name: string, pin: string) => {
    try {
      // Find user by name and pin
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('name', name)
        .eq('pin', pin)
        .single();

      if (error) {
        return { success: false, error: 'Invalid credentials' };
      }

      if (data) {
        setCurrentUser(data);
        localStorage.setItem('expense_app_user', JSON.stringify(data));
        return { success: true };
      }

      return { success: false, error: 'User not found' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('expense_app_user');
  };

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}