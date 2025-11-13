import React from "react";
import useAuthStore from "../../context/useAuthStore";
import { auth } from "../../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      alert("Failed to log out. Try again.");
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
        <h2 className="text-2xl mb-4">You’re not signed in</h2>
        <button
          onClick={() => navigate("/login")}
          className="bg-red-600 px-5 py-2 rounded-lg font-semibold hover:bg-red-700"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="bg-gray-800 p-10 rounded-2xl shadow-xl text-center w-80">
        <img
          src={user.photoURL || "https://via.placeholder.com/150"}
          alt="Profile"
          className="rounded-full w-32 h-32 mx-auto mb-4 border-4 border-red-600"
        />
        <h1 className="text-2xl font-bold mb-1">{user.name || "Unnamed"}</h1>
        <p className="text-gray-400 mb-6">{user.email}</p>

        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition-all"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;