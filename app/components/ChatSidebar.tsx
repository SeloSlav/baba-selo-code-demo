// app/components/ChatSidebar.tsx
import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookOpenReader, faGear, faHamburger, faPencilRuler, faPersonRifle, faSignOut, faStarOfLife } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../context/AuthContext"; // Import the AuthContext hook
import { RecipeList } from "./RecipeList"; // Import the new RecipeList component

export const ChatSidebar = ({
    focusInput,
    isSidebarOpen,
    toggleSidebar,
}: {
    focusInput: () => void;
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
}) => {
    const [isHydrated, setIsHydrated] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement | null>(null);

    const { logOut } = useAuth(); // Get the logout function from AuthContext

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    // Close the menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                profileMenuRef.current &&
                !profileMenuRef.current.contains(event.target) &&
                !event.target.closest(".profile-menu-icon") // Ignore clicks on the profile menu icon
            ) {
                setIsProfileMenuOpen(false); // Close menu if clicked outside
            }
        };

        document.addEventListener("click", handleClickOutside);
        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, []);

    const toggleProfileMenu = (event) => {
        event.stopPropagation(); // Prevent propagation to document click handler
        setIsProfileMenuOpen((prev) => !prev);
    };

    const handleLogout = async () => {
        try {
            await logOut(); // Call the logout function
            console.log("Successfully logged out");
        } catch (error) {
            console.error("Error during logout:", error);
        }
    };

    const handleNewConversation = () => {
        toggleSidebar();
        focusInput();
    };

    return (
        <div>
            {/* Hamburger Menu Icon */}
            <button
                onClick={toggleSidebar}
                className="absolute top-4 left-4 z-30 p-2 rounded-md hover:bg-gray-200"
            >
                <FontAwesomeIcon icon={faHamburger} className="text-[#5d5d5d]" />
            </button>

            {/* Profile Menu Icon */}
            <button
                onClick={toggleProfileMenu}
                className="profile-menu-icon absolute top-4 right-8 z-30 p-2 rounded-md hover:bg-gray-200"
            >
                <FontAwesomeIcon icon={faPersonRifle} className="text-[#5d5d5d]" />
            </button>

            {/* Profile Menu */}
            {isProfileMenuOpen && (
                <div
                    ref={profileMenuRef}
                    className="absolute top-16 right-8 z-40 bg-white rounded-3xl shadow-lg w-60 border border-gray-300 p-3"
                >
                    <ul className="space-y-1">
                        <li className="flex items-center px-4 py-2 rounded-md hover:bg-gray-100 cursor-pointer">
                            <FontAwesomeIcon icon={faBookOpenReader} className="text-[#5d5d5d] mr-3" />
                            <span>My Recipes</span>
                        </li>
                        <li className="flex items-center px-4 py-2 rounded-md hover:bg-gray-100 cursor-pointer">
                            <FontAwesomeIcon icon={faGear} className="text-[#5d5d5d] mr-3" />
                            <span>Settings</span>
                        </li>
                        <hr />
                        <li className="flex items-center px-4 py-2 rounded-md hover:bg-gray-100 cursor-pointer">
                            <FontAwesomeIcon icon={faStarOfLife} className="text-[#5d5d5d] mr-3" />
                            <span>Upgrade Plan</span>
                        </li>
                        <hr />
                        <li
                            className="flex items-center px-4 py-2 rounded-md hover:bg-gray-100 cursor-pointer"
                            onClick={handleLogout} // Call the logout handler
                        >
                            <FontAwesomeIcon icon={faSignOut} className="text-[#5d5d5d] mr-3" />
                            <span>Log Out</span>
                        </li>
                    </ul>
                </div>
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 transform z-20 bg-gray-50 w-64 h-full shadow-inner transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Sidebar Header */}
                    <div className="flex items-center justify-between p-4 border-b">
                        <h2 className="text-gray-600 text-sm font-semibold"></h2>
                        <button
                            onClick={handleNewConversation}
                            className="p-2 rounded-md hover:bg-gray-200"
                        >
                            <FontAwesomeIcon icon={faPencilRuler} className="text-[#5d5d5d]" />
                        </button>
                    </div>

                    {/* Recipe List Component */}
                    <div className="flex-grow overflow-y-auto p-4 space-y-6">
                        <RecipeList /> {/* Importing and rendering RecipeList */}
                    </div>
                </div>
            </aside>
        </div>
    );
};
