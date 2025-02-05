"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faSpinner, faCircleInfo } from "@fortawesome/free-solid-svg-icons";

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isLoading?: boolean;
  resultCount?: number;
  totalCount?: number;
  showCount?: boolean;
  isExplorePage?: boolean;
}

export const SearchBar = ({ 
  searchTerm, 
  setSearchTerm, 
  isLoading = false,
  resultCount,
  totalCount = 0,
  showCount = true,
  isExplorePage = false
}: SearchBarProps) => {
  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by title, cuisine, or ingredients..."
          className="w-full p-4 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          aria-label="Search recipes"
        />
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <FontAwesomeIcon
              icon={faSearch}
              className="text-gray-400"
              aria-hidden="true"
            />
          )}
        </div>
      </div>
      {showCount && (
        <div className="text-sm text-gray-500 flex items-center gap-2">
          {isLoading ? 'Searching...' : 
           searchTerm ? `Found ${resultCount} ${resultCount === 1 ? 'recipe' : 'recipes'}` :
           `${totalCount} total ${totalCount === 1 ? 'recipe' : 'recipes'}`}
          {isExplorePage && !searchTerm && (
            <div className="group relative">
              <FontAwesomeIcon 
                icon={faCircleInfo} 
                className="text-gray-400 hover:text-gray-600 cursor-help"
              />
              <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-black text-white text-xs rounded-lg shadow-lg z-50">
                <div className="relative">
                  <p className="font-medium mb-1.5">Only complete recipes are shown here:</p>
                  <ul className="space-y-1">
                    <li>• Add recipe summaries</li>
                    <li>• Upload recipe photos</li>
                    <li>• Get likes from others to earn spoons</li>
                    <li>• Complete all sections to maximize visibility</li>
                  </ul>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-full w-2 h-2 bg-black rotate-45"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 