"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext"; // Adjust if your AuthContext is in a different path
import { db } from "../firebase/firebase";        // Adjust if firebase config is in a different path
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";

export default function SettingsPage() {
  // 1) Get current user from AuthContext
  const { user, loading } = useAuth();

  // 2) Local state
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
  const [preferredCookingOil, setPreferredCookingOil] = useState<string>("");

  // For handling the auto-complete filters
  const [dietarySearch, setDietarySearch] = useState("");
  const [oilSearch, setOilSearch] = useState("");

  // Show/Hide dropdown states
  const [showDietaryDropdown, setShowDietaryDropdown] = useState(false);
  const [showOilDropdown, setShowOilDropdown] = useState(false);

  // Tracking when we’re actually saving
  const [isSaving, setIsSaving] = useState(false);

  // The lists of valid options
  const dietaryOptions = [
    "vegan",
    "dairy-free",
    "nut-free",
    "carnivore",
    "zero histamine",
    "zero vitamin A",
    "zero beta-carotene",
    "ketogenic",
    "gluten-free",
    "grain-free",
    "paleo",
    "autoimmune protocol (AIP)",
  ];
  const cookingOilOptions = [
    "olive oil",
    "avocado oil",
    "sunflower oil",
    "coconut oil",
    "beef tallow",
    "butter",
    "peanut oil",
    "sesame oil",
  ];

  // Refs for closing dropdown on outside click
  const dietaryRef = useRef<HTMLDivElement>(null);
  const oilRef = useRef<HTMLDivElement>(null);

  /**
   * Fetch user’s data from Firestore on mount
   */
  useEffect(() => {
    if (!user || loading) return;

    const fetchUserSettings = async () => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setDietaryPreferences(userData.dietaryPreferences || []);
          setPreferredCookingOil(userData.preferredCookingOil || "");
          // Show the oil in the input field
          setOilSearch(userData.preferredCookingOil || "");
        }
      } catch (error) {
        console.error("Error fetching user settings:", error);
      }
    };

    fetchUserSettings();
  }, [user, loading]);

  /**
   * Close dropdown if user clicks outside
   */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dietaryRef.current &&
        !dietaryRef.current.contains(event.target as Node)
      ) {
        setShowDietaryDropdown(false);
      }
      if (oilRef.current && !oilRef.current.contains(event.target as Node)) {
        setShowOilDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /**
   * Save settings to Firestore
   */
  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        dietaryPreferences,
        preferredCookingOil,
      }).catch(async (err) => {
        // If doc doesn't exist yet, create it
        if (err.code === "not-found") {
          await setDoc(userDocRef, {
            dietaryPreferences,
            preferredCookingOil,
          });
        } else {
          throw err;
        }
      });
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      // Revert button text
      setIsSaving(false);
    }
  };

  /**
   * Filtered options
   */
  const filteredDietaryOptions = dietaryOptions.filter((opt) =>
    opt.toLowerCase().includes(dietarySearch.toLowerCase())
  );
  const filteredOilOptions = cookingOilOptions.filter((oil) =>
    oil.toLowerCase().includes(oilSearch.toLowerCase())
  );

  /**
   * Handlers: multi-select dietary
   */
  const handleSelectDietary = (option: string) => {
    if (!dietaryPreferences.includes(option)) {
      setDietaryPreferences([...dietaryPreferences, option]);
    }
    setDietarySearch("");
    setShowDietaryDropdown(false);
  };
  const handleRemoveDietary = (option: string) => {
    setDietaryPreferences(
      dietaryPreferences.filter((item) => item !== option)
    );
  };

  /**
   * Handler: single-select oil
   */
  const handleSelectOil = (oil: string) => {
    setPreferredCookingOil(oil);
    setOilSearch(oil);
    setShowOilDropdown(false);
  };
  const handleRemoveOil = () => {
    setPreferredCookingOil("");
    setOilSearch("");
  };

  // If not logged in (and not loading), show a message
  if (!user && !loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h2 className="text-3xl font-bold text-center mb-12">Settings</h2>
        <p className="text-center text-gray-600">
          You need to be logged in to view settings.
        </p>
      </div>
    );
  }

  // Custom loading indicator
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <img src="/baba-removebg.png" alt="Baba" className="w-32 h-32 mb-6" />
        <div className="typing-indicator flex space-x-2">
          <div className="dot bg-gray-400 rounded-full w-6 h-6"></div>
          <div className="dot bg-gray-400 rounded-full w-6 h-6"></div>
          <div className="dot bg-gray-400 rounded-full w-6 h-6"></div>
        </div>
      </div>
    );
  }

  // Render the settings form
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h2 className="text-3xl font-bold text-center mb-12">Settings</h2>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Dietary Preferences */}
        <div className="p-8 border border-gray-200 rounded-lg shadow-sm bg-white flex flex-col">
          <h3 className="text-2xl font-bold mb-4">Dietary Preferences</h3>
          <p className="text-sm text-gray-500 mb-4">
            Select multiple dietary restrictions or preferences.
          </p>

          {/* Input + dropdown for dietary */}
          <div className="relative mb-4" ref={dietaryRef}>
            <input
              type="text"
              value={dietarySearch}
              onChange={(e) => {
                setDietarySearch(e.target.value);
                setShowDietaryDropdown(true);
              }}
              onClick={() => setShowDietaryDropdown(true)}
              placeholder="Type to search..."
              className="w-full p-2 border border-gray-300 rounded focus:outline-none"
            />
            {showDietaryDropdown && filteredDietaryOptions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-300 mt-1 rounded shadow-md max-h-40 overflow-auto">
                {filteredDietaryOptions.map((option) => (
                  <li
                    key={option}
                    onClick={() => handleSelectDietary(option)}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {option}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Selected dietary tags */}
          <div className="flex flex-wrap gap-2">
            {dietaryPreferences.map((pref) => (
              <div
                key={pref}
                className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded-full text-sm"
              >
                <span>{pref}</span>
                <button
                  onClick={() => handleRemoveDietary(pref)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Preferred Cooking Oil */}
        <div className="p-8 border border-gray-200 rounded-lg shadow-sm bg-white flex flex-col">
          <h3 className="text-2xl font-bold mb-4">Preferred Cooking Oil</h3>
          <p className="text-sm text-gray-500 mb-4">
            Select a single cooking oil option.
          </p>

          {/* Input + dropdown for oil */}
          <div className="relative mb-4" ref={oilRef}>
            <input
              type="text"
              value={oilSearch}
              onChange={(e) => {
                setOilSearch(e.target.value);
                setShowOilDropdown(true);
              }}
              onClick={() => setShowOilDropdown(true)}
              placeholder="Type or select a cooking oil..."
              className="w-full p-2 border border-gray-300 rounded focus:outline-none"
            />
            {showOilDropdown && filteredOilOptions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-300 mt-1 rounded shadow-md max-h-40 overflow-auto">
                {filteredOilOptions.map((oil) => (
                  <li
                    key={oil}
                    onClick={() => handleSelectOil(oil)}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {oil}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Show selected oil as a bubble (only one) */}
          {preferredCookingOil && (
            <div className="flex flex-wrap gap-2">
              <div
                className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded-full text-sm"
              >
                <span>{preferredCookingOil}</span>
                <button
                  onClick={handleRemoveOil}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-center mt-8">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-black text-white text-sm py-2 px-6 rounded-full hover:bg-[#212121] transition-colors"
        >
          {isSaving ? "Saving Settings..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
