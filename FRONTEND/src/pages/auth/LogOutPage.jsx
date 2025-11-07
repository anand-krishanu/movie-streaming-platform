// src/pages/auth/LogOutPage.jsx
import React, { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../context/useAuthStore";

const Logout = () => {
  const navigate = useNavigate();
  const clearUser = useAuthStore((state) => state.clearUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const doSignOut = async () => {
      try {
        await signOut(auth);
      } catch (err) {
        console.warn("Firebase signOut failed (maybe user already signed out):", err);
      } finally {
        // clear local app state and go to login
        clearUser();
        setLoading(false);
        navigate("/");
      }
    };

    doSignOut();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex items-center justify-center h-screen bg-black text-white">
      {loading ? <p>Signing out...</p> : <p>Redirecting...</p>}
    </div>
  );
};

export default Logout;
