// app/components/ProfileMenu.tsx
import React, { useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookOpenReader, faGear, faHome, faSignOut, faStarOfLife, faSpoon, faCompass, faStore } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";

interface ProfileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onLogout: () => void;
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({ isOpen, onClose, onLogout }) => {
    const profileMenuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                profileMenuRef.current &&
                !profileMenuRef.current.contains(event.target as Node)
            ) {
                onClose(); // Close the menu when clicking outside
            }
        };

        if (isOpen) {
            document.addEventListener("click", handleClickOutside);
        }
        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            ref={profileMenuRef}
            className="absolute top-full right-0 mt-1 z-40 bg-white rounded-3xl shadow-lg w-60 border border-gray-300 p-3"
            style={{ maxHeight: 'calc(100vh - 5rem)', overflowY: 'auto' }}
        >
            <ul className="space-y-1">
                <li className="flex items-center px-4 py-2 rounded-md hover:bg-gray-100 cursor-pointer">
                    <Link href="/" className="flex items-center w-full">
                        <FontAwesomeIcon icon={faHome} className="text-[#5d5d5d] mr-3" />
                        <span>Home</span>
                    </Link>
                </li>
                <li className="flex items-center px-4 py-2 rounded-md hover:bg-gray-100 cursor-pointer">
                    <Link href="/explore" className="flex items-center w-full">
                        <FontAwesomeIcon icon={faCompass} className="text-[#5d5d5d] mr-3" />
                        <span>Explore</span>
                    </Link>
                </li>
                <li className="flex items-center px-4 py-2 rounded-md hover:bg-gray-100 cursor-pointer">
                    <Link href="/recipes" className="flex items-center w-full">
                        <FontAwesomeIcon icon={faBookOpenReader} className="text-[#5d5d5d] mr-3" />
                        <span>My Recipes</span>
                    </Link>
                </li>
                <li className="flex items-center px-4 py-2 rounded-md hover:bg-gray-100 cursor-pointer">
                    <Link href="/spoons" className="flex items-center w-full justify-between">
                        <div className="flex items-center">
                            <FontAwesomeIcon icon={faSpoon} className="text-[#5d5d5d] mr-3" />
                            <span>Spoons</span>
                        </div>
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                            Earn! ✨
                        </span>
                    </Link>
                </li>
                <li className="flex items-center px-4 py-2 rounded-md hover:bg-gray-100 cursor-pointer">
                    <Link href="/marketplace" className="flex items-center w-full justify-between">
                        <div className="flex items-center">
                            <FontAwesomeIcon icon={faStore} className="text-[#5d5d5d] mr-3" />
                            <span>Market</span>
                        </div>
                        <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                            New! 🎁
                        </span>
                    </Link>
                </li>
                <li className="flex items-center px-4 py-2 rounded-md hover:bg-gray-100 cursor-pointer">
                    <Link href="/settings" className="flex items-center w-full">
                        <FontAwesomeIcon icon={faGear} className="text-[#5d5d5d] mr-3" />
                        <span>Settings</span>
                    </Link>
                </li>
                <hr />
                <li className="flex items-center px-4 py-2 rounded-md hover:bg-gray-100 cursor-pointer">
                    <Link href="/upgrade" className="flex items-center w-full">
                        <FontAwesomeIcon icon={faStarOfLife} className="text-[#5d5d5d] mr-3" />
                        <span>Upgrade Plan</span>
                    </Link>
                </li>
                <hr />
                <li
                    className="flex items-center px-4 py-2 rounded-md hover:bg-gray-100 cursor-pointer"
                    onClick={onLogout}
                >
                    <FontAwesomeIcon icon={faSignOut} className="text-[#5d5d5d] mr-3" />
                    <span>Log Out</span>
                </li>
            </ul>
        </div>
    );
};
