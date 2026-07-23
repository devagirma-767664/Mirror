// src/pages/LoginPage.tsx
import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { loginUser } from "../../../features/auth/authThunks";
import { useNavigate } from "react-router-dom";

const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error, user, token } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(loginUser({ email, password }));
  };

  // 🔹 Redirect based on role once login succeeds
  useEffect(() => {
    if (user && token) {
      switch (user.role) {
        case "admin":
          navigate("/admin");
          break;
        case "barber":
          navigate("/barber");
          break;
        case "receptionist":
          navigate("/receptionist");
          break;
        case "customer":
          navigate("/customer");
          break;
        default:
          navigate("/dashboard");
      }
    }
  }, [user, token, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md"
      >
        <h2 className="text-2xl font-bold text-center text-yellow-600 mb-6">
          Staff Login
        </h2>

        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-600"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-600"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-yellow-600 text-white py-2 rounded-lg shadow hover:bg-yellow-700 transition font-medium"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* ✅ Go back to Home Page button */}
        <button
          type="button"
          onClick={() => navigate("/")}
          className="w-full mt-4 bg-gray-300 text-gray-800 py-2 rounded-lg shadow hover:bg-gray-400 transition font-medium"
        >
          Go back to Home Page
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
