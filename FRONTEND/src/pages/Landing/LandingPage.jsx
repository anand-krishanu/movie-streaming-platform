import React, { useEffect, useState } from "react";
import "./Landing.css";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const Landing = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  const handleSignIn = () => {
    navigate("/login");
  };

  const handleWatchMovies = () => {
    navigate("/home");
  };

  return (
    <div className="hero-section">
      <h1>Watch Unlimited Movies And TV Shows For Free</h1>
      <p>
        Unlock a World of Entertainment: Sign up now and dive into the magic of
        free movie streaming!
      </p>

      <div className="button-container">
        {user ? (
          <button className="land-button" onClick={handleWatchMovies}>
            Watch Movies
          </button>
        ) : (
          <button className="land-button" onClick={handleSignIn}>
            Sign In
          </button>
        )}
      </div>
    </div>
  );
};

export default Landing;