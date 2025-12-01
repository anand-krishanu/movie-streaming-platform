import { createBrowserRouter } from "react-router-dom";
import Home from "../pages/Home/Home.jsx";
import Watchlist from "../pages/WatchList/WatchList.jsx";
import WatchHistory from "../pages/History/HistoryPage.jsx";
import FavouritesPage from "../pages/Favourites/FavouritesPage.jsx";
import Login from "../pages/auth/LoginPage.jsx";
import Logout from "../pages/auth/LogOutPage.jsx";
import ProfilePage from "../pages/Profile/ProfilePage.jsx";
import AddMovie from "../pages/Admin/AddMovie.jsx";
import AdminDashboard from "../pages/Admin/AdmnDashboard.jsx";
// import MovieDetails from "../pages/Movie/MovieDetails.jsx";
// import WatchPage from "../pages/Watch/WatchPage.jsx";
import SearchResults from "../pages/Search/SearchResults.jsx";
import LandingPage from "../pages/Landing/LandingPage.jsx";
import NotFound from "../pages/NotFound/NotFound.jsx";
import MoviePlayer from "../pages/Movie/MoviePlayer.jsx";

const appRoutes = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/home", element: <Home /> },
  { path: "/watchlist", element: <Watchlist /> },
  { path: "/history", element: <WatchHistory /> },
  { path: "/favorites", element: <FavouritesPage /> },
  { path: "/login", element: <Login /> },
  { path: "/logout", element: <Logout /> },
  { path: "/profile", element: <ProfilePage /> },
  { path: "/admin", element: <AdminDashboard /> },
  { path: "/admin/add-movie", element: <AddMovie /> },
  { path: "/player/:id", element: <MoviePlayer /> },
  // { path: "/watch/:id", element: <WatchPage /> },
  { path: "/search", element: <SearchResults /> },
  { path: "*", element: <NotFound /> },
]);

export default appRoutes;