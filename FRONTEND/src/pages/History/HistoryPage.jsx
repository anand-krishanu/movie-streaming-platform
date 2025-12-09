import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function WatchHistory() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <Navbar />
      <div className="p-6 flex-grow pb-20">Your Watch History movies will appear here</div>
      <Footer />
    </div>
  );
}