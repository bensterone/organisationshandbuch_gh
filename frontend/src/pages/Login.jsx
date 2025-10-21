import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const Login = () => {
  const navigate = useNavigate();
  const { setUser, setToken } = useAuthStore();
  const [formData, setFormData] = useState({ username: 'admin', password: 'admin' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/auth/login', formData);
      setUser(response.data.user);
      setToken(response.data.accessToken);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <h1 className="text-3xl font-bold text-center mb-6">Welcome Back</h1>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Username"
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
          />
          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
          <Button type="submit" className="w-full" loading={loading}>
            Sign In
          </Button>
        </form>
        <p className="text-sm text-gray-600 text-center mt-4">
          Demo credentials: admin / admin
        </p>
      </div>
    </div>
  );
};

export default Login;