import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuthStore from "../context/useAuthStore";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearUser = useAuthStore((s) => s.clearUser);

  const navItems = [
    { name: "Home", path: "/home" },
    { name: "Watchlist", path: "/watchlist" },
    // { name: "History", path: "/history" },
    { name: "Favorites", path: "/favorites" },
  ];

  // dropdown state + click outside to close
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  useEffect(() => {
    function onDocClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // helper to get initials when no photo
  const getInitials = (name = "") => {
    const parts = name.trim().split(/\s+/);
    if (!parts.length) return "CS";
    const initials = (parts[0][0] || "") + (parts[1]?.[0] || "");
    return initials.toUpperCase();
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn("Firebase signOut failed:", err);
    } finally {
      clearUser();
      setOpen(false);
      navigate("/");
    }
  };

  const [imgError, setImgError] = useState(false);
  useEffect(() => {
    setImgError(false);
  }, [user?.photoURL]);

  return (
    <nav className="flex items-center justify-between p-4 bg-zinc-900 text-white shadow-md">
      <Link to="/" className="text-2xl font-bold">
        🎬 Movie Stream
      </Link>

      <div className="flex gap-6">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`hover:text-red-500 ${
              pathname === item.path ? "text-red-500 font-semibold" : ""
            }`}
          >
            {item.name}
          </Link>
        ))}
      </div>

      <div className="flex items-center">
        {!user && (
          <Link
            to="/login"
            className="bg-red-500 px-4 py-2 rounded-md text-white hover:bg-red-600"
          >
            Login
          </Link>
        )}

        {user && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-2 focus:outline-none"
            >
              {user.photoURL && !imgError ? (
                <img
                  src={user.photoURL}
                  alt={user.name}
                  onError={() => setImgError(true)}
                  className="w-9 h-9 rounded-full object-cover"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-semibold text-white">
                  {getInitials(user.name)}
                </div>
              )}
              <span className="hidden md:inline">{user.name}</span>
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-40 bg-zinc-800 rounded shadow-lg p-2 z-50">
                <button
                  onClick={() => {
                    setOpen(false);
                    navigate("/profile");
                  }}
                  className="block w-full text-left px-3 py-2 hover:bg-zinc-700 rounded"
                >
                  Profile
                </button>

                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-3 py-2 hover:bg-zinc-700 rounded"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
