// app/components/ProfileMenu.tsx
import React, { useRef, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookOpenReader, faGear, faHome, faSignOut, faStarOfLife, faSpoon, faCompass, faStore, faShieldHalved, faSeedling } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { useAuth } from '../context/AuthContext';
import { isAdmin } from '../config/admin';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

interface ProfileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onLogout: () => void;
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({ isOpen, onClose, onLogout }) => {
    const menuRef = useRef<HTMLDivElement | null>(null);
    const { user } = useAuth();
    const [isUserAdmin, setIsUserAdmin] = useState(false);
    const [username, setUsername] = useState<string>("");

    useEffect(() => {
        const checkAdminStatus = async () => {
            if (user) {
                const adminStatus = await isAdmin(user.uid);
                setIsUserAdmin(adminStatus);
            } else {
                setIsUserAdmin(false);
            }
        };

        checkAdminStatus();
    }, [user]);

    useEffect(() => {
        const fetchUsername = async () => {
            if (user) {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    setUsername(userDoc.data().username || "");
                }
            }
        };

        fetchUsername();
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
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
            ref={menuRef}
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
                    <Link href={username ? `/${username}` : "/recipes"} className="flex items-center w-full">
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
                            Redeem! 🎁
                        </span>
                    </Link>
                </li>
                <li className="flex items-center px-4 py-2 rounded-md hover:bg-gray-100 cursor-pointer">
                    <Link href="/yard" className="flex items-center w-full justify-between">
                        <div className="flex items-center">
                            <FontAwesomeIcon icon={faSeedling} className="text-[#5d5d5d] mr-3" />
                            <span>Yard</span>
                        </div>
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                            Play! 🌱
                        </span>
                    </Link>
                </li>
                <li className="flex items-center px-4 py-2 rounded-md hover:bg-gray-100 cursor-pointer">
                    <Link href="/settings" className="flex items-center w-full">
                        <FontAwesomeIcon icon={faGear} className="text-[#5d5d5d] mr-3" />
                        <span>Settings</span>
                    </Link>
                </li>
                {isUserAdmin && (
                    <li className="flex items-center px-4 py-2 rounded-md hover:bg-gray-100 cursor-pointer">
                        <Link href="/admin" className="flex items-center w-full">
                            <FontAwesomeIcon icon={faShieldHalved} className="text-[#5d5d5d] mr-3" />
                            <span>Admin</span>
                        </Link>
                    </li>
                )}
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
