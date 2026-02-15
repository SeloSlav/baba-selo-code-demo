"use client";

import Image from "next/image";

export const RecipeFooter = () => {
  return (
    <div className="text-center mb-8 mt-24 pb-32">
      <div className="flex justify-center mb-4">
        <Image
          src="/baba-removebg.png"
          alt="Baba Selo"
          width={128}
          height={128}
          className="opacity-100"
        />
      </div>
      <div className="text-gray-500 text-sm px-4">
        <p>⚠️ Please double-check all ingredients, measurements, and cooking steps, as even Baba Selo can make mistakes sometimes.</p>
        <p className="mt-2 mb-24">For food safety, always ensure proper cooking temperatures and handling of ingredients.</p>
      </div>
    </div>
  );
}; 