"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const ChatSidebar = dynamic(() => import("./ChatSidebar").then((m) => m.ChatSidebar), { ssr: false });

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export const SidebarLayout = ({ children }: SidebarLayoutProps) => {
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
    <div className="flex min-h-screen relative">
      <ChatSidebar
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
      />

      {isSidebarOpen && isMobileOverlay && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      <main className={`transition-all duration-300 flex-grow min-h-screen pt-14 md:pt-0 ${sidebarClass}`}>
        {children}
      </main>
    </div>
  );
};
