import dynamic from "next/dynamic";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const metadata = {
  alternates: {
    canonical: "https://www.babaselo.com/",
  },
};

const HomeClient = dynamic(() => import("./components/HomeClient").then((m) => m.HomeClient), {
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-amber-50/30 to-transparent">
      <img src="/baba-removebg.png" alt="Baba" className="w-32 h-32 mb-6 animate-pulse" />
      <div className="typing-indicator flex space-x-2">
        <div className="dot rounded-full w-6 h-6"></div>
        <div className="dot rounded-full w-6 h-6"></div>
        <div className="dot rounded-full w-6 h-6"></div>
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
