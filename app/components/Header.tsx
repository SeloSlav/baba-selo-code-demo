import React from "react";

export const Header = () => {
  return (
    <div className="flex items-center justify-end p-4 shadow-md">
      <button className="relative group">
        <img
          src="/user-profile-icon.png"
          alt="Profile"
          className="w-8 h-8 rounded-full cursor-pointer"
        />
        {/* Profile Dropdown */}
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg hidden group-hover:block">
          <ul className="py-2">
            <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Settings</li>
            <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Upgrade Plan</li>
            <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Sign Out</li>
          </ul>
        </div>
      </button>
    </div>
  );
};
