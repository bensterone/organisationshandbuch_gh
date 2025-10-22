import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import api from "../services/api";
import Input from "../components/common/Input";
import Button from "../components/common/Button";

export default function Login() {
  const navigate = useNavigate();
  const { setUser, setToken } = useAuthStore();

  // Pre-fill for dev; change or clear as you like
  const [identifier, setIdentifier] = useState("admin");      // username OR email
  const [password, setPassword] = useState("admin123");       // matches our guidance
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Send both; backend matches (username = ? OR email = ?)
      const { data } = await api.post("/auth/login", {
        username: identifier,
        email: identifier,
        password,
      });

      // Backend returns { user, token }
      setUser(data.user);
      setToken(data.token);

      navigate("/");
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        (err?.response?.status === 401 ? "Invalid credentials" : "Login failed");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <h1 className="text-3xl font-bold text-center mb-6">Welcome Back</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Identifier (username or email)"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

        <Button type="submit" className="w-full" loading={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </Button>
        </form>

        <p className="text-sm text-gray-600 text-center mt-4">
          Demo: <code>admin</code> / <code>admin123</code>
        </p>
      </div>
    </div>
  );
}
