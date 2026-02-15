"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faSpinner, faCircleInfo } from "@fortawesome/free-solid-svg-icons";

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isLoading?: boolean;
  isPageLoading?: boolean;
  resultCount?: number;
  totalCount?: number;
  showCount?: boolean;
  isExplorePage?: boolean;
  placeholder?: string;
}

export const SearchBar = ({ 
  searchTerm, 
  setSearchTerm, 
  isLoading = false,
  isPageLoading = false,
  resultCount,
  totalCount = 0,
  showCount = true,
  isExplorePage = false,
  placeholder = "Search by title, cuisine, or ingredients..."
}: SearchBarProps) => {
  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          className="w-full p-4 pr-12 border border-amber-200 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white"
          aria-label="Search recipes"
          disabled={isPageLoading}
        />
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
          {isPageLoading || isLoading ? (
            <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <FontAwesomeIcon
              icon={faSearch}
              className="text-amber-600/70"
              aria-hidden="true"
            />
          )}
        </div>
      </div>
      {showCount && (
        <div className="text-sm text-amber-900/70 flex items-center gap-2">
          {isPageLoading ? (
            <span>10,000+ recipes made with love ❤️</span>
          ) : isLoading ? (
            <span>Searching...</span>
          ) : (
            <span>
              {searchTerm 
                ? `Found ${resultCount} ${resultCount === 1 ? 'recipe' : 'recipes'}` 
                : `${totalCount} total ${totalCount === 1 ? 'recipe' : 'recipes'}`}
            </span>
          )}
          {!isPageLoading && isExplorePage && !searchTerm && (
            <div className="group relative">
              <FontAwesomeIcon 
                icon={faCircleInfo} 
                className="text-amber-600/70 hover:text-amber-700 cursor-help"
              />
              <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-black text-white text-xs rounded-lg shadow-lg z-50">
                <div className="relative">
                  <p className="font-medium mb-1.5">Only complete recipes are shown here:</p>
                  <ul className="space-y-1">
                    <li>• Add recipe summaries</li>
                    <li>• Upload recipe photos</li>
                    <li>• Complete all sections to maximize visibility</li>
                    <li>• Get likes from others to earn spoons</li>
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