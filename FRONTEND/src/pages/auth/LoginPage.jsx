// import { signInWithGoogle } from "../../firebase";
// import { useNavigate } from "react-router-dom";

export default function Login() {
//   const navigate = useNavigate();

//   const handleLogin = async () => {
//     await signInWithGoogle();
//     navigate("/dashboard");
//   };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-800">
      <div className="bg-white/10 backdrop-blur-xl p-10 rounded-3xl text-center shadow-2xl">
        <h1 className="text-3xl font-bold text-white mb-6">Welcome Back 👋</h1>
        <button
        //   onClick={handleLogin}
          className="bg-white text-black px-6 py-3 rounded-lg font-semibold shadow-md hover:scale-105 transition-all duration-300"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}