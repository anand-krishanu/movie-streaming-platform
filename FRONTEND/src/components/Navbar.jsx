import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const { pathname } = useLocation();

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Watchlist", path: "/watchlist" },
    { name: "History", path: "/history" },
    { name: "Favorites", path: "/favorites" },
  ];

  return (
    <nav className="flex items-center justify-between p-4 bg-zinc-900 text-white shadow-md">
      <Link to="/" className="text-2xl font-bold">
        🎬 CineStream
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
      <Link
        to="/login"
        className="bg-red-500 px-4 py-2 rounded-md text-white hover:bg-red-600"
      >
        Login
      </Link>
    </nav>
  );
}