import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

import AppLayout from './layouts/AppLayout';
import AuthLayout from './layouts/AuthLayout';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import GroupsPage from './pages/GroupsPage';
import GroupDetailPage from './pages/GroupDetailPage';
import ExpenseHistoryPage from './pages/ExpenseHistoryPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

export function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Unauthenticated Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Protected Application Routes */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/groups" element={<GroupsPage />} />
            <Route path="/groups/:id" element={<GroupDetailPage />} />
            <Route path="/expenses" element={<ExpenseHistoryPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* 404 Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
