'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Users, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { MOCK_USERS } from '../../lib/constants';
import BrandPanel from '../../components/auth/BrandPanel';
import AuthCard from '../../components/auth/AuthCard';
import LoginForm from '../../components/auth/LoginForm';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        router.push('/dashboard');
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (userEmail: string, userPassword: string) => {
    setError('');
    setLoading(true);
    setEmail(userEmail);
    setPassword(userPassword);
    const success = await login(userEmail, userPassword);
    if (success) {
      router.push('/dashboard');
    }
    setLoading(false);
  };

  const quickLoginOptions = [
    { label: 'Super Admin', icon: Shield, email: MOCK_USERS[0].email, password: MOCK_USERS[0].password, color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' },
    { label: 'HR Manager', icon: Users, email: MOCK_USERS[1].email, password: MOCK_USERS[1].password, color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
    { label: 'Employee', icon: User, email: MOCK_USERS[2].email, password: MOCK_USERS[2].password, color: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' },
  ];

  return (
    <div className="min-h-screen flex">
      <BrandPanel />
      <AuthCard>
        <LoginForm
          email={email}
          password={password}
          showPassword={showPassword}
          error={error}
          loading={loading}
          rememberMe={rememberMe}
          quickLoginOptions={quickLoginOptions}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onToggleShowPassword={() => setShowPassword(!showPassword)}
          onRememberMeChange={setRememberMe}
          onSubmit={handleSubmit}
          onQuickLogin={handleQuickLogin}
        />
      </AuthCard>
    </div>
  );
}
