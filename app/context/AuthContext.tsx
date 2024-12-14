"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { auth } from "../firebase/firebase";
import { useRouter } from "next/navigation"; // Import Next.js router
import { ProfileMenu } from "../components/ProfileMenu"; // Import ProfileMenu
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"; // Import FontAwesome
import { faUserCircle } from "@fortawesome/free-solid-svg-icons"; // Import user icon

interface AuthContextType {
  user: any;
  signInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false); // ProfileMenu state
  const profileMenuRef = useRef<HTMLDivElement | null>(null); // Ref for the ProfileMenu
  const router = useRouter(); // Initialize router

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);

      // Redirect to the base path if user is logged in
      if (user) {
        router.push("/"); // Redirect to the app
      }
    });

    return () => unsubscribe();
  }, [router]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth); // Sign out using Firebase
      console.log("User successfully logged out");
      router.push("/login"); // Redirect to login page
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen((prev) => !prev);
  };

  const closeProfileMenu = () => {
    setIsProfileMenuOpen(false);
  };

  // Close the menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        closeProfileMenu(); // Close the menu
      }
    };

    if (isProfileMenuOpen) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  return (
    <AuthContext.Provider value={{ user, signInWithGoogle, logOut, loading }}>
      {/* Global Profile Menu Button */}
      {user && (
        <button
          onClick={toggleProfileMenu}
          className="fixed top-4 right-8 z-30 p-2 rounded-md hover:bg-gray-200 bg-white"
        >
          <FontAwesomeIcon icon={faUserCircle} className="text-[#5d5d5d] text-xl" />
        </button>
      )}

      {/* Global Profile Menu */}
      <ProfileMenu
        isOpen={isProfileMenuOpen}
        onClose={closeProfileMenu}
        onLogout={logOut}
      />

      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
