import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuthStore from "../context/useAuthStore";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { FaSearch, FaTimes } from "react-icons/fa";

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const dbUser = useAuthStore((s) => s.dbUser);
  const clearUser = useAuthStore((s) => s.clearUser);

  const [scrolled, setScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showGenres, setShowGenres] = useState(true);
  const [showAllGenres, setShowAllGenres] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const navItems = [
    { name: "Home", path: "/home" },
    { name: "Watchlist", path: "/watchlist" },
    { name: "Favorites", path: "/favorites" },
  ];

  const allGenres = [
    "Action", "Adventure", "Animation", "Biography", "Comedy", "Crime",
    "Documentary", "Drama", "Family", "Fantasy", "Horror", "Music",
    "Mystery", "Romance", "Sci-Fi", "Sport", "Thriller", "War", "Western"
  ];

  const visibleGenres = showAllGenres ? allGenres : allGenres.slice(0, 10);

  // Check if current page should show genres
  const shouldShowGenres = !["/admin", "/admin/add-movie"].includes(pathname) && 
                          !pathname.startsWith("/admin/");

  // dropdown state + click outside to close
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchExpanded(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // Handle scroll to collapse/show second row
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down - only hide after scrolling past 100px
        setShowGenres(false);
      } else if (currentScrollY < lastScrollY || currentScrollY < 50) {
        // Scrolling up or near top - show genres
        setShowGenres(true);
      }
      
      setLastScrollY(currentScrollY);
      setScrolled(currentScrollY > 50);
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

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

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchExpanded(false);
      setSearchQuery("");
    }
  };

  const [imgError, setImgError] = useState(false);
  useEffect(() => {
    setImgError(false);
  }, [user?.photoURL]);

  return (
    <nav className="sticky top-0 z-50 text-white transition-all duration-300">
      {/* Top Row - Main Navigation */}
      <div className="px-6 py-4 bg-black/95 backdrop-blur-md shadow-lg shadow-black/50 relative z-50">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link 
            to="/" 
            className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent hover:from-red-400 hover:to-red-500 transition-all duration-300"
          >
            Movie Stream
          </Link>

          {/* Primary Navigation */}
          <div className="hidden md:flex gap-8 items-center">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`relative text-lg font-medium transition-all duration-300 hover:text-red-500 group ${
                  pathname === item.path ? "text-red-500" : "text-gray-300"
                }`}
              >
                {item.name}
                <span
                  className={`absolute -bottom-1 left-0 h-0.5 bg-red-500 transition-all duration-300 ${
                    pathname === item.path ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              </Link>
            ))}
          </div>

          {/* Right Section - Search & User */}
          <div className="flex items-center gap-4">
            {/* Expandable Search */}
            {user && (
              <div ref={searchRef} className="relative">
                <form onSubmit={handleSearch} className="flex items-center">
                  <div
                    className={`flex items-center bg-zinc-800 rounded-full transition-all duration-300 ${
                      searchExpanded ? "w-64 border border-zinc-700" : "w-10"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSearchExpanded(!searchExpanded)}
                      className="p-2 hover:text-red-500 transition-colors duration-200"
                    >
                      <FaSearch className="text-lg" />
                    </button>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search movies..."
                      className={`bg-transparent outline-none text-base transition-all duration-300 ${
                        searchExpanded ? "w-full pr-10 opacity-100" : "w-0 opacity-0"
                      }`}
                    />
                    {searchExpanded && searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 hover:text-red-500 transition-colors duration-200"
                      >
                        <FaTimes className="text-sm" />
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* Admin Links */}
            {dbUser?.role === "ADMIN" && (
              <div className="hidden lg:flex gap-4">
                <Link 
                  to="/admin"
                  className={`text-lg font-medium transition-all duration-300 hover:text-red-500 ${
                    pathname === "/admin" ? "text-red-500" : "text-gray-300"
                  }`}
                >
                  Admin
                </Link>
                <Link 
                  to="/admin/add-movie"
                  className={`text-lg font-medium transition-all duration-300 hover:text-red-500 ${
                    pathname === "/admin/add-movie" ? "text-red-500" : "text-gray-300"
                  }`}
                >
                  Add Movie
                </Link>
              </div>
            )}

            {/* User Profile / Login */}
            <div className="flex items-center">
              {!user && (
                <Link
                  to="/login"
                  className="bg-red-500 px-6 py-2 rounded-full text-white text-lg font-medium hover:bg-red-600 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-red-500/50"
                >
                  Login
                </Link>
              )}

              {user && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setOpen((v) => !v)}
                    className="flex items-center gap-2 focus:outline-none hover:scale-105 transition-transform duration-200"
                  >
                    {user.photoURL && !imgError ? (
                      <img
                        src={user.photoURL}
                        alt={user.name}
                        onError={() => setImgError(true)}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-zinc-700 hover:ring-red-500 transition-all duration-300"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-lg font-semibold text-white ring-2 ring-zinc-700 hover:ring-red-500 transition-all duration-300">
                        {getInitials(user.name)}
                      </div>
                    )}
                    <span className="hidden md:inline text-lg font-medium">{user.name}</span>
                  </button>

                  {open && (
                    <div className="absolute right-0 mt-3 w-48 bg-zinc-800 rounded-lg shadow-xl p-2 z-[60] border border-zinc-700 animate-fadeIn">
                      <button
                        onClick={() => {
                          setOpen(false);
                          navigate("/profile");
                        }}
                        className="block w-full text-left px-4 py-2.5 hover:bg-zinc-700 rounded-md transition-all duration-200 text-lg"
                      >
                        Profile
                      </button>

                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2.5 hover:bg-red-600 rounded-md transition-all duration-200 text-lg mt-1"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row - Genre Tags (Collapses on Scroll) - Only show on non-admin pages */}
      {shouldShowGenres && (
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out relative z-40 ${
            showGenres ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-6 py-2">
            <div className="flex justify-center items-center gap-3 flex-wrap">
              {visibleGenres.map((genre) => (
                <Link
                  key={genre}
                  to={`/home?genre=${genre.toLowerCase()}`}
                  className="px-4 py-1.5 bg-white/5 backdrop-blur-md rounded-full text-xs font-medium hover:bg-red-500 hover:scale-105 transition-all duration-300 whitespace-nowrap border border-white/10 hover:border-red-500 shadow-sm"
                >
                  {genre}
                </Link>
              ))}
              <button
                onClick={() => setShowAllGenres(!showAllGenres)}
                className="px-4 py-1.5 bg-red-600/20 backdrop-blur-md rounded-full text-xs font-medium hover:bg-red-500 hover:scale-105 transition-all duration-300 border border-red-500/30 hover:border-red-500 shadow-sm flex items-center gap-1"
              >
                {showAllGenres ? (
                  <>
                    <FaTimes className="text-xs" />
                    <span>Less</span>
                  </>
                ) : (
                  <>
                    <span>+</span>
                    <span>More</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
