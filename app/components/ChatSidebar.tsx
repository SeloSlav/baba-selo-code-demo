// app/components/ChatSidebar.tsx
import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHamburger, faPersonRifle, faPencilRuler, faClose } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../context/AuthContext";
import { RecipeList } from "./RecipeList";
import Link from "next/link";

export const ChatSidebar = ({
    focusInput,
    isSidebarOpen,
    toggleSidebar,
    chatWindowRef,
}: {
    focusInput: () => void;
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    chatWindowRef: React.RefObject<any>;
}) => {
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

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
                    {/* Sidebar Header */}
                    <div className="flex items-center justify-between p-4 border-b">
                        <h2 className="text-gray-600 text-sm font-semibold"></h2>
                        <button
                            onClick={toggleSidebar}
                            className="p-2 rounded-md hover:bg-gray-200"
                        >
                            <FontAwesomeIcon icon={faClose} className="text-[#5d5d5d]" />
                        </button>
                    </div>

                    {/* Recipe List Component */}
                    <div className="flex-grow overflow-y-auto p-4 space-y-6">
                        <RecipeList />
                    </div>
                </div>
            </aside>
        </div>
    );
};
