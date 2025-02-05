"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export const SearchBar = ({ searchTerm, setSearchTerm }: SearchBarProps) => {
  return (
    <div className="relative">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search by title, cuisine, or ingredients..."
        className="w-full p-4 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        aria-label="Search recipes"
      />
      <FontAwesomeIcon
        icon={faSearch}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"
        aria-hidden="true"
      />
    </div>
  );
}; 