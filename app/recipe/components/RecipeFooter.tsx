"use client";

import Image from "next/image";

export const RecipeFooter = () => {
  return (
    <div className="text-center mb-6 mt-12 pb-12">
      <div className="flex justify-center mb-3">
        <Image
          src="/baba-removebg.png"
          alt="Baba Selo"
          width={96}
          height={96}
          className="opacity-100"
        />
      </div>
      <div className="text-amber-900/70 text-sm px-4">
        <p>⚠️ Please double-check all ingredients, measurements, and cooking steps, as even Baba Selo can make mistakes sometimes.</p>
        <p className="mt-2 mb-0">For food safety, always ensure proper cooking temperatures and handling of ingredients.</p>
      </div>
    </div>
  );
}; 