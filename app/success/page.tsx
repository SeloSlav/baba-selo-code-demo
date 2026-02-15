"use client";

import Link from "next/link";

export default function SuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50/50 to-white px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg shadow-amber-900/5 border border-amber-100 p-8 text-center">
        <div className="text-amber-600 mb-4 text-6xl">✓</div>
        <h1 className="text-2xl font-bold mb-2">Welcome to Pro!</h1>
        <p className="text-gray-600 mb-6">
          Thank you for upgrading. You now have access to custom meal plans, unlimited chat history, and the ability to save and pin multiple chats.
        </p>
        <Link
          href="/"
          className="inline-block bg-amber-600 text-white px-6 py-3 rounded-xl hover:bg-amber-700 transition-colors"
        >
          Start chatting with Baba
        </Link>
      </div>
    </div>
  );
}
