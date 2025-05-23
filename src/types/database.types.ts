export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          pin: string;
          role: 'admin' | 'user';
          salary: number | null;
          company_balance: number;
          personal_balance: number;
          salary_balance: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          pin: string;
          role: 'admin' | 'user';
          salary?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          pin?: string;
          role?: 'admin' | 'user';
          salary?: number | null;
          created_at?: string;
        };
      };
      expenses: {
        Row: {
          id: string;
          user_id: string;
          category: string;
          description: string;
          amount: number;
          image: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category: string;
          description: string;
          amount: number;
          photo_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category?: string;
          description?: string;
          amount?: number;
          photo_url?: string | null;
          created_at?: string;
        };
      };
      company_balance: {
        Row: {
          id: string;
          amount: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          amount: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          amount?: number;
          updated_at?: string;
        };
      };
    };
  };
}

export type User = Database['public']['Tables']['users']['Row'];
export type Expense = Database['public']['Tables']['expenses']['Row'];
export type CompanyBalance = Database['public']['Tables']['company_balance']['Row'];