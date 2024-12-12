"use client";

import React, { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if the user is not authenticated
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    // Show a loading spinner while checking authentication
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-start space-x-2">
          <div className="typing-indicator flex space-x-2 mt-4">
            <div className="dot bg-gray-400 rounded-full w-2 h-2"></div>
            <div className="dot bg-gray-400 rounded-full w-2 h-2"></div>
            <div className="dot bg-gray-400 rounded-full w-2 h-2"></div>
          </div>
        </div>
      </div>
    );
  }

  // Render children if user is authenticated
  return <>{children}</>;
};
