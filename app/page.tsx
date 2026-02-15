import dynamic from "next/dynamic";
import { ProtectedRoute } from "./components/ProtectedRoute";

const HomeClient = dynamic(() => import("./components/HomeClient").then((m) => m.HomeClient), {
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <img src="/baba-removebg.png" alt="Baba" className="w-32 h-32 mb-6 animate-pulse" />
      <div className="typing-indicator flex space-x-2">
        <div className="dot bg-gray-400 rounded-full w-6 h-6"></div>
        <div className="dot bg-gray-400 rounded-full w-6 h-6"></div>
        <div className="dot bg-gray-400 rounded-full w-6 h-6"></div>
      </div>
    </div>
  ),
});

export default function Page() {
  return (
    <ProtectedRoute>
      <HomeClient />
    </ProtectedRoute>
  );
}
