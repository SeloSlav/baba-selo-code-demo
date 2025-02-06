"use client";

import React from "react";
import Image from "next/image";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { signInWithGoogle } = useAuth(); // Call the Google Sign-In method

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      {/* Baba logo */}
      <Image
        src="/baba.png"
        alt="Baba Logo"
        width={150}
        height={150}
        className="mb-4"
      />

      {/* Title and Subtitle */}
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Ask me anything, dear</h1>
      <p className="text-gray-600 mb-8 text-center max-w-sm">Your personal digital grandmother, ready to share recipes, stories, and wisdom</p>

      {/* Google Sign-In Button */}
      <button
        onClick={signInWithGoogle}
        className="flex items-center justify-center px-6 py-3 bg-white border border-gray-300 rounded-md shadow-md hover:bg-gray-100 transition"
        aria-label="Sign in with Google"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 48 48"
          width="24"
          height="24"
          className="mr-2"
        >
          <path
            fill="#EA4335"
            d="M24 9.5c3.24 0 5.45 1.41 6.67 2.59L34.2 9.5C31.79 7.26 28.28 6 24 6 16.46 6 10.09 10.8 8.15 17h6.66C15.89 13.16 19.63 9.5 24 9.5z"
          />
          <path
            fill="#34A853"
            d="M24 42c5.27 0 9.61-2.18 12.59-5.68l-6.05-5.02C29.43 32.59 27 34 24 34c-4.48 0-8.28-2.89-9.67-6.93H8.14V30c2 6.18 7.51 10 13.86 10z"
          />
          <path
            fill="#4A90E2"
            d="M43.79 24.5c0-1.01-.09-1.99-.24-2.94H24v5.39h11.32c-.44 2.22-1.79 4.09-3.8 5.31v4.39h6.15c3.59-3.32 6.12-8.21 6.12-11.5z"
          />
          <path
            fill="#FBBC05"
            d="M8.15 17c-.37 1.12-.58 2.33-.58 3.5s.21 2.38.58 3.5l6.6-5.5c0-1.38.16-2.73.43-3.5H8.15z"
          />
        </svg>
        <span className="text-gray-700 font-medium">Sign in with Google</span>
      </button>

      {/* Terms Text */}
      <p className="text-gray-500 text-xs text-center mt-6 max-w-sm">
        By continuing, you agree to our{' '}
        <a 
          href="/terms" 
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Terms of Service
        </a>{' '}
        and{' '}
        <a 
          href="/privacy" 
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Privacy Policy
        </a>
      </p>
    </div>
  );
};

export default Login;
