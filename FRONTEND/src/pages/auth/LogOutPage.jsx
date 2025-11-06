// import { logOut } from "../../firebase";
// import { useNavigate } from "react-router-dom";

export default function Logout() {
//   const navigate = useNavigate();

//   const handleLogout = async () => {
//     await logOut();
//     navigate("/");
//   };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-700 to-purple-800">
      <div className="bg-white/10 backdrop-blur-xl p-10 rounded-3xl text-center shadow-xl">
        <h1 className="text-2xl font-semibold text-white mb-6">
          Ready to log out?
        </h1>
        <button
        //   onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300"
        >
          Logout
        </button>
      </div>
    </div>
  );
}