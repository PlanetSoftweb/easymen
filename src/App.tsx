import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginForm from './components/LoginForm';
import ExpenseDetail from './components/ExpenseDetail';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import BalanceManagement from './pages/admin/BalanceManagement';
import AllExpenses from './pages/admin/AllExpenses';

// User Pages
import UserDashboard from './pages/user/UserDashboard';
import UserExpenses from './pages/user/UserExpenses';
import UserCredits from './pages/user/UserCredits';
import AddExpense from './pages/user/AddExpense';

// Protected Route Component
const ProtectedRoute = ({ 
  children, 
  requiredRole 
}: { 
  children: React.ReactNode, 
  requiredRole?: 'admin' | 'user' 
}) => {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && currentUser.role !== requiredRole) {
    return <Navigate to={currentUser.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* Public Routes */}
            <Route index element={<LoginForm />} />

            {/* Admin Routes */}
            <Route path="admin" element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="admin/users" element={
              <ProtectedRoute requiredRole="admin">
                <UserManagement />
              </ProtectedRoute>
            } />
            <Route path="admin/balance" element={
              <ProtectedRoute requiredRole="admin">
                <BalanceManagement />
              </ProtectedRoute>
            } />
            <Route path="admin/expenses" element={
              <ProtectedRoute requiredRole="admin">
                <AllExpenses />
              </ProtectedRoute>
            } />

            {/* User Routes */}
            <Route path="dashboard" element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            } />
            <Route path="expenses" element={
              <ProtectedRoute>
                <UserExpenses />
              </ProtectedRoute>
            } />
            <Route path="credits" element={
              <ProtectedRoute>
                <UserCredits />
              </ProtectedRoute>
            } />
            <Route path="expenses/new" element={
              <ProtectedRoute>
                <AddExpense />
              </ProtectedRoute>
            } />
            <Route path="expenses/:id" element={
              <ProtectedRoute>
                <ExpenseDetail />
              </ProtectedRoute>
            } />

            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        <ToastContainer position="top-right" autoClose={3000} />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;