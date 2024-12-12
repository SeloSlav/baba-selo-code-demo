"use client";

import React, { useRef, useEffect, useState } from "react";
import { ChatWindow } from "./components/ChatWindow";
import { ChatSidebar } from "./components/ChatSidebar";
import { ProtectedRoute } from "./components/ProtectedRoute";

const Home = () => {
  const chatWindowRef = useRef<any>();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [windowWidth, setWindowWidth] = useState<number | null>(null);

  useEffect(() => {
    const updateSidebarState = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      if (width >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    updateSidebarState();
    window.addEventListener("resize", updateSidebarState);

    return () => {
      window.removeEventListener("resize", updateSidebarState);
    };
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const isMobileOverlay = windowWidth !== null && windowWidth < 768;
  const sidebarClass =
    isSidebarOpen && windowWidth !== null && windowWidth >= 768
      ? "ml-64"
      : "ml-0";

  return (
    <div className="flex h-screen relative">
      <ChatSidebar
        focusInput={() => chatWindowRef.current?.focusInput?.()}
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
      />

      {isSidebarOpen && isMobileOverlay && (
        <div
          className="absolute inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      <div className={`transition-all duration-300 flex-grow ${sidebarClass}`}>
        <ChatWindow ref={chatWindowRef} isSidebarOpen={isSidebarOpen} />
      </div>
    </div>
  );
};

// Wrap Home in ProtectedRoute here
export default function Page() {
  return (
    <ProtectedRoute>
      <Home />
    </ProtectedRoute>
  );
}
