// src/pages/auth/LoginPage.jsx
import React, { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../../firebase";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../context/useAuthStore";

const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const setAuthUser = useAuthStore((state) => state.setUser);
  const targetRoute = "/home"; // home route per AppRoutes.jsx

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Pass the actual Firebase user object to the store
      // The setUser method will handle syncing with backend
      await setAuthUser(user);

      // Navigate to home after successful login
      navigate(targetRoute);
    } catch (error) {
      console.error("Google sign-in error:", error);
      alert("Sign-in failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-black text-white">
      <h1 className="text-4xl font-bold mb-8">Movie Stream</h1>

      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className={`bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center ${
          loading ? "opacity-60 cursor-not-allowed" : ""
        }`}
      >
        {loading ? "Signing in..." : "Sign in with Google"}
      </button>
    </div>
  );
};

export default LoginPage;
