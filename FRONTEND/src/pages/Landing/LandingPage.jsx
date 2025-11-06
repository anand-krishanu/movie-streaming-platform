import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="h-screen flex flex-col justify-center items-center bg-gradient-to-br from-sky-600 to-blue-900 text-white text-center">
      <h1 className="text-5xl font-bold mb-4">Welcome to My Cool App 🚀</h1>
      <p className="text-lg mb-8">Explore your personalized dashboard and more.</p>
      <Link
        to="/login"
        className="bg-white text-black px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-all duration-300"
      >
        Get Started
      </Link>
    </div>
  );
}