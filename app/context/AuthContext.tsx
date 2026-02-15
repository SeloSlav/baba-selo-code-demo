"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { useRouter, usePathname } from "next/navigation"; // Import Next.js router & usePathname
import { ProfileMenu } from "../components/ProfileMenu"; 
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"; 
import { faUserCircle, faSpoon } from "@fortawesome/free-solid-svg-icons"; 
import { SpoonHistoryMenu } from "../components/SpoonHistoryMenu";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";

interface AuthContextType {
  user: any;
  signInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
  loading: boolean;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  signInWithGoogle: async () => {},
  logOut: async () => {},
  loading: true,
  authError: null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false); 
  const [isSpoonMenuOpen, setIsSpoonMenuOpen] = useState(false);
  const [spoonData, setSpoonData] = useState<any>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null); 
  const spoonMenuRef = useRef<HTMLDivElement | null>(null);
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

  // Handle redirect result when user returns from Google sign-in redirect
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          setAuthError(null);
        }
      })
      .catch((error) => {
        const code = error?.code || "";
        if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
          setAuthError(null); // User cancelled, don't show error
        } else {
          setAuthError("Sign in failed. Please try again.");
        }
      });
  }, []);

  // Subscribe to spoon data updates
  useEffect(() => {
    if (!user) {
      setSpoonData(null);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, "spoonPoints", user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        // Add read status to transactions if not present
        const transactions = data.transactions?.map((t: any) => ({
          ...t,
          read: t.read ?? false
        })) || [];
        setSpoonData({ ...data, transactions });
      } else {
        setSpoonData({ totalPoints: 0, transactions: [] });
      }
    });

    return () => unsubscribe();
  }, [user]);

  const signInWithGoogle = async () => {
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // After successful login, `onAuthStateChanged` will handle redirection if needed.
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code || "";
      // Popup blocked (Safari, Brave, strict privacy) - fall back to redirect
      if (code === "auth/popup-blocked" || code === "auth/cancelled-popup-request") {
        await signInWithRedirect(auth, provider);
        return;
      }
      // User closed popup - don't show error
      if (code === "auth/popup-closed-by-user") {
        return;
      }
      setAuthError("Sign in failed. Please try again or check if popups are allowed.");
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
    setIsSpoonMenuOpen(false);
  };

  const toggleSpoonMenu = () => {
    setIsSpoonMenuOpen((prev) => !prev);
    setIsProfileMenuOpen(false);
  };

  const closeProfileMenu = () => {
    setIsProfileMenuOpen(false);
  };

  const closeSpoonMenu = () => {
    setIsSpoonMenuOpen(false);
  };

  const handleTransactionRead = async (transactionId: string) => {
    if (!user || !spoonData) return;

    // Find the transaction and mark it as read
    const updatedTransactions = spoonData.transactions.map((t: any) => {
      // Create the same ID format as in the SpoonHistoryMenu
      const tId = `${t.timestamp.toDate().getTime()}-${t.actionType}-${t.targetId || ''}`;
      if (tId === transactionId) {
        return { ...t, read: true };
      }
      return t;
    });

    // Update local state
    setSpoonData({ ...spoonData, transactions: updatedTransactions });

    // Update Firestore
    try {
      const userPointsRef = doc(db, "spoonPoints", user.uid);
      await updateDoc(userPointsRef, {
        transactions: updatedTransactions
      });
    } catch (error) {
      console.error("Error updating transaction read status:", error);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user || !spoonData) return;

    // Mark all transactions as read
    const updatedTransactions = spoonData.transactions.map((t: any) => ({
      ...t,
      read: true
    }));

    // Update local state
    setSpoonData({ ...spoonData, transactions: updatedTransactions });

    // Update Firestore
    try {
      const userPointsRef = doc(db, "spoonPoints", user.uid);
      await updateDoc(userPointsRef, {
        transactions: updatedTransactions
      });
    } catch (error) {
      console.error("Error marking all transactions as read:", error);
    }
  };

  // Calculate unread notifications count
  const unreadCount = spoonData?.transactions?.filter((t: any) => !t.read).length || 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) &&
        (spoonMenuRef.current && !spoonMenuRef.current.contains(event.target as Node))
      ) {
        closeProfileMenu();
        closeSpoonMenu();
      }
    };

    if (isProfileMenuOpen || isSpoonMenuOpen) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isProfileMenuOpen, isSpoonMenuOpen]);

  return (
    <AuthContext.Provider value={{ user, signInWithGoogle, logOut, loading, authError }}>
      <div className="fixed top-4 right-8 z-30 flex items-center gap-2">
        {user && (
          /* Spoon Menu Button - only shown for authenticated users */
          <button
            onClick={toggleSpoonMenu}
            className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-amber-50 bg-white shadow-md border border-amber-200/80 hover:border-amber-300 hover:shadow-amber-900/5 transition-colors"
          >
            <FontAwesomeIcon icon={faSpoon} className="text-amber-700 text-lg" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>
        )}

        {/* Profile Menu Button - shown for all users */}
        <button
          onClick={toggleProfileMenu}
          className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-amber-50 bg-white shadow-md border border-amber-200/80 hover:border-amber-300 hover:shadow-amber-900/5 transition-colors"
        >
          <FontAwesomeIcon icon={faUserCircle} className="text-amber-700 text-lg" />
        </button>

        {/* Menus */}
        {user && (
          <SpoonHistoryMenu
            isOpen={isSpoonMenuOpen}
            onClose={closeSpoonMenu}
            transactions={spoonData?.transactions || []}
            totalPoints={spoonData?.totalPoints || 0}
            onTransactionRead={handleTransactionRead}
            onMarkAllRead={handleMarkAllRead}
            unreadCount={unreadCount}
          />
        )}

        <ProfileMenu
          isOpen={isProfileMenuOpen}
          onClose={closeProfileMenu}
          onLogout={logOut}
        />
      </div>

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
