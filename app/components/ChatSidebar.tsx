// app/components/ChatSidebar.tsx
import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHamburger, faPersonRifle, faPencilRuler, faClose, faThumbtack, faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../context/AuthContext";
import { RecipeList } from "./RecipeList";
import Link from "next/link";
import Image from "next/image";

// Add shimmer effect for loading state
const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#f6f7f8" offset="0%" />
      <stop stop-color="#edeef1" offset="50%" />
      <stop stop-color="#f6f7f8" offset="100%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#f6f7f8" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite" />
</svg>`;

const toBase64 = (str: string) =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str);

export const ChatSidebar = ({
    focusInput,
    isSidebarOpen,
    toggleSidebar,
    chatWindowRef,
    recipe,
    loadingPinAction,
    handlePinUnpin,
    handleDelete
}: {
    focusInput: () => void;
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    chatWindowRef: React.RefObject<any>;
    recipe?: any;
    loadingPinAction?: boolean;
    handlePinUnpin?: (isPinned: boolean) => void;
    handleDelete?: (id: string, title: string) => void;
}) => {
    const [isHydrated, setIsHydrated] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [isImageLoading, setIsImageLoading] = useState(true);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    const renderMenu = () => {
        return (
            <div className="absolute right-0 z-40 bg-white rounded-xl shadow-lg w-48 border border-gray-200 p-2">
                <ul className="space-y-1">
                    <li 
                        className="flex items-center px-3 py-2 rounded-md hover:bg-gray-100 cursor-pointer disabled:opacity-50"
                        onClick={() => !loadingPinAction && handlePinUnpin(!!recipe.pinned)}
                    >
                        {loadingPinAction ? (
                            <>
                                <div className="w-4 h-4 mr-3">
                                    <div className="w-full h-full border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                                <span>{recipe.pinned ? 'Unpinning...' : 'Pinning...'}</span>
                            </>
                        ) : (
                            <>
                                <FontAwesomeIcon
                                    icon={faThumbtack}
                                    className={`w-4 h-4 mr-3 transform transition-all duration-300 ${
                                        recipe.pinned ? 'rotate-[45deg] scale-110 text-yellow-500' : 'hover:scale-110 text-gray-400'
                                    }`}
                                />
                                <span>{recipe.pinned ? "Unpin Recipe" : "Pin Recipe"}</span>
                            </>
                        )}
                    </li>
                    <li
                        className="flex items-center px-3 py-2 rounded-md hover:bg-gray-100 cursor-pointer text-red-500"
                        onClick={() => handleDelete(recipe.id, recipe.recipeTitle)}
                    >
                        <FontAwesomeIcon icon={faTrashAlt} className="w-4 h-4 mr-3" />
                        <span>Delete recipe</span>
                    </li>
                </ul>
            </div>
        );
    };

    return (
        <div>
            {/* Hamburger Menu Icon */}
            <button
                onClick={toggleSidebar}
                className="fixed top-4 left-4 z-30 p-2 rounded-md hover:bg-gray-200 bg-white"
            >
                <FontAwesomeIcon icon={faHamburger} className="text-[#5d5d5d]" />
            </button>

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 transform z-20 bg-gray-50 w-64 h-full shadow-inner transition-transform duration-300 ease-in-out ${
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="flex flex-col h-full">
                    {/* Sidebar Header with optimized image */}
                    <div className="flex items-center justify-between p-4 border-b">
                        <div className="relative w-8 h-8">
                            {!imageError ? (
                                <Image
                                    src="/baba-removebg.png"
                                    alt="Baba Logo"
                                    fill
                                    className={`object-contain transition-opacity duration-300 ${
                                        isImageLoading ? 'opacity-0' : 'opacity-100'
                                    }`}
                                    onLoad={() => setIsImageLoading(false)}
                                    onError={() => setImageError(true)}
                                    placeholder="blur"
                                    blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(32, 32))}`}
                                    sizes="32px"
                                    priority
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-full">
                                    <span className="text-lg">👨‍🍳</span>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={toggleSidebar}
                            className="p-2 rounded-md hover:bg-gray-200"
                        >
                            <FontAwesomeIcon icon={faClose} className="text-[#5d5d5d]" />
                        </button>
                    </div>

                    {/* Recipe List Component */}
                    <div className="flex-grow overflow-y-auto p-4 space-y-6">
                        {/* Upgrade Button */}
                        <Link href="/upgrade" className="block group">
                            <div className="bg-black text-white p-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg relative overflow-hidden">
                                {/* Gradient overlay - visible on mobile, transitions on hover for desktop */}
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-40 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300"></div>
                                
                                <div className="relative z-10">
                                    <div className="flex flex-col gap-2 mb-2">
                                        <span className="text-lg font-semibold">Upgrade to Pro</span>
                                       
                                    </div>
                                    <p className="text-sm text-gray-200 mb-2">Voice chat, meal plans & more</p>
                                    <div className="flex items-center justify-between text-xs text-gray-300">
                                        <span>Starting at $8/month</span>
                                        <span className="flex items-center gap-1">
                                            Upgrade now <span className="text-purple-400">→</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Link>

                        <RecipeList />
                    </div>
                </div>
            </aside>
        </div>
    );
};
