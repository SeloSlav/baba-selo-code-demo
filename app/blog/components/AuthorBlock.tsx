"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { BABA_SELO_AUTHOR } from "../blog-constants";

export function AuthorBlock() {
  return (
    <div className="mt-12 pt-8 border-t border-amber-200">
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <div className="flex-shrink-0 w-20 h-20 relative rounded-full overflow-hidden bg-amber-100">
          <Image
            src={BABA_SELO_AUTHOR.imagePath}
            alt={BABA_SELO_AUTHOR.name}
            fill
            className="object-contain"
            sizes="80px"
          />
        </div>
        <div>
          <p className="text-sm font-medium text-amber-900/70 uppercase tracking-wide">
            Written by
          </p>
          <h3 className="text-lg font-semibold text-amber-900 mt-1">
            <Link href="/" className="hover:text-amber-700 transition-colors">
              {BABA_SELO_AUTHOR.name}
            </Link>
          </h3>
          <p className="text-sm text-amber-600 mt-0.5">{BABA_SELO_AUTHOR.role}</p>
          <p className="text-amber-800/90 mt-3 text-sm leading-relaxed">
            {BABA_SELO_AUTHOR.description}
          </p>
        </div>
      </div>
    </div>
  );
}
