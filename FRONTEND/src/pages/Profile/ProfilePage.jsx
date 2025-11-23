import React from "react";
import Navbar from "../../components/Navbar";
import useAuthStore from "../../context/useAuthStore";
import { auth } from "../../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const dbUser = useAuthStore((state) => state.dbUser);
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
    <div className="bg-black min-h-screen text-white">
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] pt-20">
        <div className="bg-zinc-900 p-10 rounded-2xl shadow-xl text-center w-96">
          <img
            src={user.photoURL || dbUser?.picture || "https://via.placeholder.com/150"}
            alt="Profile"
            className="rounded-full w-32 h-32 mx-auto mb-4 border-4 border-red-600 object-cover"
          />
          <h1 className="text-3xl font-bold mb-2">{dbUser?.name || user.name || "User"}</h1>
          <p className="text-gray-400 mb-2">{user.email || dbUser?.email}</p>
          {dbUser?.role && (
            <span className="inline-block px-3 py-1 mb-4 bg-red-600 rounded-full text-sm font-semibold">
              {dbUser.role}
            </span>
          )}

          <div className="mt-6 space-y-3">
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;