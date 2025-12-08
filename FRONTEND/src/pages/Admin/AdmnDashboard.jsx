import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import movieApi from "../../api/movieApi";
import useAuthStore from "../../context/useAuthStore";
import { toast } from "react-toastify";
import { FaRobot, FaChartLine, FaDatabase, FaSync } from "react-icons/fa";

export default function AdminDashboard() {
  const [mlStatus, setMlStatus] = useState(null);
  const [training, setTraining] = useState(false);
  const [loading, setLoading] = useState(true);
  const { dbUser } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is admin
    if (dbUser && dbUser.role !== "ADMIN") {
      toast.error("Access denied. Admin only.");
      navigate("/");
      return;
    }

    fetchMLStatus();
  }, [dbUser, navigate]);

  const fetchMLStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/");
      const data = await response.json();
      setMlStatus(data);
    } catch (error) {
      console.error("Failed to fetch ML status:", error);
      setMlStatus({ status: "unavailable" });
    } finally {
      setLoading(false);
    }
  };

  const handleTrainModel = async () => {
    try {
setTraining(true);
      toast.info('Starting model training... This may take a minute.');
      
      const result = await movieApi.trainMLModel();
      
      toast.success('Model trained successfully!');
      
      // Refresh ML status
      await fetchMLStatus();
    } catch (error) {
      console.error("Training failed:", error);
      toast.error('Training failed. Check if ML service is running.');
    } finally {
      setTraining(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-black min-h-screen text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen text-white">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

        {/* ML Service Status Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-zinc-900 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <FaRobot className="text-3xl text-blue-500" />
              <h2 className="text-2xl font-semibold">ML Service Status</h2>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Service:</span>
                <span className={`font-semibold ${
                  mlStatus?.status === "running" 
                    ? "text-green-400" 
                    : "text-red-400"
                }`}>
                  {mlStatus?.status === "running" ? "Running" : "Offline"}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Model Status:</span>
                <span className={`font-semibold ${
                  mlStatus?.model_trained 
                    ? "text-green-400" 
                    : "text-yellow-400"
                }`}>
                  {mlStatus?.model_trained ? "Trained" : "Not Trained"}
                </span>
              </div>
              
              {mlStatus?.status === "unavailable" && (
                <div className="mt-4 p-3 bg-red-900/30 rounded border border-red-700">
                  <p className="text-sm text-red-300">
                    ML service is not running. Start it with:
                    <code className="block mt-2 bg-black p-2 rounded">
                      cd ml-service && python app.py
                    </code>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-zinc-900 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <FaChartLine className="text-3xl text-purple-500" />
              <h2 className="text-2xl font-semibold">Quick Actions</h2>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={handleTrainModel}
                disabled={training || mlStatus?.status !== "running"}
                className={`w-full flex items-center justify-center gap-3 px-6 py-3 rounded-lg font-semibold transition-all ${
                  training || mlStatus?.status !== "running"
                    ? "bg-gray-700 cursor-not-allowed opacity-50"
                    : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                }`}
              >
                {training ? (
                  <>
                    <FaSync className="animate-spin" />
                    Training Model...
                  </>
                ) : (
                  <>
                    <FaRobot />
                    Train ML Model
                  </>
                )}
              </button>
              
              <button
                onClick={fetchMLStatus}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-semibold transition-all"
              >
                <FaSync />
                Refresh Status
              </button>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="bg-zinc-900 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <FaDatabase className="text-3xl text-green-500" />
            <h2 className="text-2xl font-semibold">ML Recommendations Info</h2>
          </div>
          
          <div className="space-y-4 text-gray-300">
            <div className="p-4 bg-zinc-800 rounded-lg">
              <h3 className="font-semibold text-white mb-2">How It Works</h3>
              <p className="text-sm">
                The ML service uses collaborative filtering (NMF) and content-based filtering 
                to generate personalized movie recommendations for users.
              </p>
            </div>
            
            <div className="p-4 bg-zinc-800 rounded-lg">
              <h3 className="font-semibold text-white mb-2">When to Train</h3>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>After adding new movies to the platform</li>
                <li>When users have added new favorites or watch history</li>
                <li>Recommended: Train daily or weekly for best results</li>
                <li>Minimum: 5+ users with 10+ movies for meaningful recommendations</li>
              </ul>
            </div>
            
            <div className="p-4 bg-zinc-800 rounded-lg">
              <h3 className="font-semibold text-white mb-2">Current Behavior</h3>
              <p className="text-sm">
                {mlStatus?.model_trained 
                  ? "Using ML-powered personalized recommendations"
                  : "Using popular movies as fallback (train model for personalization)"
                }
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
