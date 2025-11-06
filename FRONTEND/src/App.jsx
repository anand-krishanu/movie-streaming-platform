import './App.css'
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { RouterProvider } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";

function App() {
  return (
    <>
  <ToastContainer position="top-right" />
      <RouterProvider router={AppRoutes} />
    </>
  );
}

export default App;