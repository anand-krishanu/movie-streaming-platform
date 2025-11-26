import { Link } from "react-router-dom";

export default function Error404() {
  return (
    <div className="h-screen flex flex-col justify-center items-center bg-gradient-to-br from-red-700 to-orange-800 text-white text-center">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-lg mb-6">Page not found</p>
      <Link
        to="/"
        className="bg-white text-black px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-all duration-300"
      >
        Go Home
      </Link>
    </div>
  );
}
