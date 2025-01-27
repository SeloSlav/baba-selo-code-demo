"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { auth } from "../firebase/firebase";
import { useRouter, usePathname } from "next/navigation"; // Import Next.js router & usePathname
import { ProfileMenu } from "../components/ProfileMenu"; 
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"; 
import { faUserCircle } from "@fortawesome/free-solid-svg-icons"; 

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
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false); 
  const profileMenuRef = useRef<HTMLDivElement | null>(null); 
  const router = useRouter(); 
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      // Only redirect to home if user is logged in AND currently on '/login' or '/'
      // This ensures that if the user is already on a page (like '/recipe/[id]'),
      // they won't be kicked back to home, preserving their intended UX.
      if (currentUser && (pathname === "/login" || pathname === "/")) {
        router.push("/");
      }
    });

    return () => unsubscribe();
  }, [router, pathname]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // After successful login, `onAuthStateChanged` will handle redirection if needed.
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
      console.log("User successfully logged out");
      router.push("/login");
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        closeProfileMenu();
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
      {user && (
        <div className="fixed top-4 right-8 z-30">
          <button
            onClick={toggleProfileMenu}
            className="relative p-2 rounded-md hover:bg-gray-200 bg-white"
          >
            <FontAwesomeIcon icon={faUserCircle} className="text-[#5d5d5d] text-xl" />
          </button>

          <ProfileMenu
            isOpen={isProfileMenuOpen}
            onClose={closeProfileMenu}
            onLogout={logOut}
          />
        </div>
      )}

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
