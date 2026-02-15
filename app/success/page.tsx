"use client";

import Link from "next/link";

export default function SuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="text-green-600 mb-4 text-6xl">✓</div>
        <h1 className="text-2xl font-bold mb-2">Welcome to Pro!</h1>
        <p className="text-gray-600 mb-6">
          Thank you for upgrading. You now have access to custom meal plans, unlimited chat history, and the ability to save and pin multiple chats.
        </p>
        <Link
          href="/"
          className="inline-block bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-900 transition-colors"
        >
          Start chatting with Baba
        </Link>
      </div>
    </div>
  );
}
