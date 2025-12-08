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
import AuthGuard from "../components/AuthGuard.jsx";

const appRoutes = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/home", element: <AuthGuard><Home /></AuthGuard> },
  { path: "/watchlist", element: <AuthGuard><Watchlist /></AuthGuard> },
  { path: "/history", element: <AuthGuard><WatchHistory /></AuthGuard> },
  { path: "/favorites", element: <AuthGuard><FavouritesPage /></AuthGuard> },
  { path: "/login", element: <Login /> },
  { path: "/logout", element: <Logout /> },
  { path: "/profile", element: <AuthGuard><ProfilePage /></AuthGuard> },
  { path: "/admin", element: <AuthGuard><AdminDashboard /></AuthGuard> },
  { path: "/admin/add-movie", element: <AuthGuard><AddMovie /></AuthGuard> },
  { path: "/player/:id", element: <AuthGuard><MoviePlayer /></AuthGuard> },
  // { path: "/watch/:id", element: <WatchPage /> },
  { path: "/search", element: <AuthGuard><SearchResults /></AuthGuard> },
  { path: "*", element: <NotFound /> },
]);

export default appRoutes;