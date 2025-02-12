import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faXmark, faCat, faSpoon, faStar, faGamepad, 
  faClock, faLightbulb, faGem, faHeart, faLocationDot 
} from '@fortawesome/free-solid-svg-icons';

interface HelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpDialog: React.FC<HelpDialogProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-[99999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-xl max-w-3xl w-full max-h-[85vh] relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">How to Play Baba's Cat Yard</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(85vh - 140px)' }}>
          <div className="space-y-8">
            <p className="text-lg">
              Welcome to <span className="font-semibold">Baba's Cat Yard</span>! This is a special place where you can attract and befriend various cats by placing food and toys. Each cat has its own personality and rarity, and they'll reward you with spoon points for your hospitality!
            </p>

            {/* Basic Gameplay Section */}
            <div className="bg-amber-50 rounded-lg p-4 sm:p-6 space-y-4 border border-amber-100">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 p-3 rounded-full flex-shrink-0">
                  <FontAwesomeIcon icon={faGamepad} className="text-amber-600 w-5 h-5" />
                </div>
                <h3 className="font-semibold text-amber-900 text-lg">Basic Gameplay</h3>
              </div>
              <div className="grid gap-4">
                {[
                  {
                    title: "Place Food & Toys",
                    description: "Open your inventory and place food to attract cats (one food item at a time). Add toys to increase visit chances!",
                    icon: faSpoon,
                  },
                  {
                    title: "Wait for Cats",
                    description: "Cats will visit periodically to enjoy your offerings. Each food item has a limited number of visits before it's consumed.",
                    icon: faCat,
                  },
                  {
                    title: "Earn Rewards",
                    description: "When cats visit, you'll earn spoon points based on the cat's rarity and the food they enjoyed. These points can be used at the Market!",
                    icon: faStar,
                  }
                ].map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-[2rem_1fr] items-start bg-white p-4 rounded-lg hover:bg-amber-50 transition-all duration-200 border border-amber-100 gap-4"
                  >
                    <div className="bg-amber-100 p-2 rounded-full flex items-center justify-center">
                      <FontAwesomeIcon icon={item.icon} className="text-amber-600 w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-amber-900">{item.title}</h4>
                      <p className="text-amber-700 text-sm mt-1">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cat Visit Mechanics */}
            <div className="bg-blue-50 rounded-lg p-4 sm:p-6 space-y-4 border border-blue-100">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-full flex-shrink-0">
                  <FontAwesomeIcon icon={faClock} className="text-blue-600 w-5 h-5" />
                </div>
                <h3 className="font-semibold text-blue-900 text-lg">Visit Mechanics</h3>
              </div>
              <div className="space-y-4">
                <p className="text-blue-800">Cats visit your yard based on several factors:</p>
                <div className="grid gap-3">
                  {[
                    "Cats check for food every 5 minutes",
                    "Base chance of a cat visiting is 40%",
                    "Each unique toy in your yard adds 10% to the visit chance",
                    "Maximum visit chance is 90%",
                    "Food rarity determines which cats can visit",
                    "Only one food item can be placed at a time"
                  ].map((tip, index) => (
                    <div key={index} className="flex items-center gap-2 bg-white p-3 rounded-lg border border-blue-100">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      <span className="text-blue-800 text-sm">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Cat Rarities Section */}
            <div className="bg-purple-50 rounded-lg p-4 sm:p-6 space-y-4 border border-purple-100">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-3 rounded-full flex-shrink-0">
                  <FontAwesomeIcon icon={faGem} className="text-purple-600 w-5 h-5" />
                </div>
                <h3 className="font-semibold text-purple-900 text-lg">Cat Rarities & Rewards</h3>
              </div>
              <div className="grid gap-3">
                {[
                  { 
                    rarity: "Common", 
                    visits: "2 visits per food", 
                    multiplier: "5x spoon multiplier",
                    color: "gray",
                    examples: "Neighborhood cats, Strays"
                  },
                  { 
                    rarity: "Uncommon", 
                    visits: "4 visits per food", 
                    multiplier: "10x spoon multiplier",
                    color: "green",
                    examples: "Friendly visitors, Regular guests"
                  },
                  { 
                    rarity: "Rare", 
                    visits: "6 visits per food", 
                    multiplier: "15x spoon multiplier",
                    color: "blue",
                    examples: "Special breeds, Unique patterns"
                  },
                  { 
                    rarity: "Epic", 
                    visits: "8 visits per food", 
                    multiplier: "25x spoon multiplier",
                    color: "purple",
                    examples: "Mystical cats, Ancient breeds"
                  },
                  { 
                    rarity: "Legendary", 
                    visits: "12 visits per food", 
                    multiplier: "40x spoon multiplier",
                    color: "yellow",
                    examples: "Mythical cats, Divine visitors"
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="bg-white p-4 rounded-lg hover:bg-purple-50 transition-all duration-200 border border-purple-100"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-semibold text-${item.color}-600 text-lg`}>{item.rarity}</span>
                      <div className={`w-3 h-3 rounded-full bg-${item.color}-500`} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">{item.visits}</p>
                      <p className="text-sm text-purple-700">{item.multiplier}</p>
                      <p className="text-sm text-gray-500">Examples: {item.examples}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pro Tips Section */}
            <div className="bg-green-50 rounded-lg p-4 sm:p-6 space-y-4 border border-green-100">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-3 rounded-full flex-shrink-0">
                  <FontAwesomeIcon icon={faLightbulb} className="text-green-600 w-5 h-5" />
                </div>
                <h3 className="font-semibold text-green-900 text-lg">Pro Tips & Strategies</h3>
              </div>
              <div className="grid gap-3">
                {[
                  {
                    tip: "Strategic Food Placement", 
                    description: "Since you can only place one food item at a time, use higher rarity food when you'll be away -s they last longer and accumulate more rewards while you're gone!",
                  },
                  {
                    tip: "Toy Variety",
                    description: "Different toys can attract different types of cats. Try to fill all available toy spots!",
                  },
                  {
                    tip: "Check History",
                    description: "Use the cat history menu to track which cats have visited and their rewards.",
                  },
                  {
                    tip: "Timing Matters",
                    description: "Cats check for food every 5 minutes, so make sure to keep food available!",
                  }
                ].map((item, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg border border-green-100">
                    <h4 className="font-semibold text-green-800 mb-1">{item.tip}</h4>
                    <p className="text-sm text-green-700">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-sm text-gray-600 mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <FontAwesomeIcon icon={faHeart} className="text-red-400" />
                <span className="font-semibold">Remember</span>
              </div>
              <ul className="list-disc list-inside space-y-1">
                <li>You can only have one food item placed at a time</li>
                <li>Each unique toy adds 10% to the visit chance (up to 90% total)</li>
                <li>Rarer cats give more spoon points as rewards</li>
                <li>Check your cat history often to see who has visited!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpDialog; 