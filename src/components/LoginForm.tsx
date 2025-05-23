
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types/database.types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Wallet } from 'lucide-react';
import { toast } from 'react-toastify';

export default function LoginForm() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showPin, setShowPin] = useState<boolean>(false);

  const navigate = useNavigate();
  const { login, currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      navigate(currentUser.role === 'admin' ? '/admin' : '/dashboard');
    }

    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, name')
        .order('name');

      if (error) {
        console.error('Error fetching users:', error);
        return;
      }
      setUsers(data || []);
    };

    fetchUsers();
  }, [currentUser, navigate]);

  const handlePinInput = (digit: string) => {
    if (pin.length < 4) {
      // Vibrate for 50ms when PIN digit is entered
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      setPin(prev => (prev + digit).slice(0, 4));
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !pin) {
      setError('Please select a user and enter your PIN');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const userName = users.find(u => u.id === selectedUser)?.name || '';
      const result = await login(userName, pin);
      if (result.success) {
        const user = await supabase.from('users').select('*').eq('name', userName).single();
        toast.success('Login successful! Welcome back ' + userName, {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          theme: "light",
          style: {
            background: 'white',
            color: '#10B981',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '14px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #E5E7EB'
          }
        });
        if (user.data?.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(result.error || 'Invalid credentials');
        setPin('');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto space-y-8 bg-white p-8 rounded-2xl shadow-xl">
        <div className="text-center">
          <div className="mx-auto h-24 w-24 rounded-xl bg-gray-50 flex items-center justify-center shadow-lg border border-gray-100">
            <Wallet size={48} className="text-gray-700" />
          </div>
          <h1 className="mt-6 text-4xl font-bold text-black">SmartSpend</h1>
          <p className="mt-2 text-sm text-gray-700">
            Select your name and enter your 4-digit PIN.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/10 border-l-4 border-red-500 p-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="appearance-none relative block w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            >
              <option value="">Select your name</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>

            <div className="relative">
              <div className="flex justify-center space-x-4 mb-2 relative px-4 py-3 border border-gray-200 rounded-xl bg-white">
                {Array(4).fill(0).map((_, i) => (
                  <div
                    key={i}
                    className="text-2xl font-bold"
                  >
                    {showPin ? (
                      <span>{pin[i] || ''}</span>
                    ) : (
                      <span>{pin[i] ? '*' : '·'}</span>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-gray-100 rounded-lg text-gray-600 hover:bg-gray-200"
                >
                  {showPin ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handlePinInput(num.toString())}
                  className="p-4 text-2xl font-semibold bg-white border border-gray-200 rounded-xl text-gray-900 hover:bg-gray-50 transition-all focus:outline-none focus:ring-2 focus:ring-gray-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-md"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                className="p-4 text-2xl font-semibold bg-white border border-gray-200 rounded-xl text-gray-900 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200 shadow-sm"
              />
              <button
                type="button"
                onClick={() => handlePinInput('0')}
                className="p-4 text-2xl font-semibold bg-white border border-gray-200 rounded-xl text-gray-900 hover:bg-gray-50 transition-all focus:outline-none focus:ring-2 focus:ring-gray-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-md"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="p-4 flex items-center justify-center bg-white border border-gray-200 rounded-xl text-gray-900 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200 shadow-sm"
              >
                <ArrowLeft size={24} />
              </button>
            </div>

            <button
              type="submit"
              disabled={!selectedUser || pin.length !== 4 || loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-lg font-medium text-white bg-black hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Unlocking...' : 'Unlock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
