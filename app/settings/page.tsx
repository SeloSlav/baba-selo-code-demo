"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext"; // Adjust if your AuthContext is in a different path
import { db } from "../firebase/firebase";        // Adjust if firebase config is in a different path
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";

// Image style options with their prompts
const imageStyleOptions = {
  "rustic-traditional": {
    name: "Rustic Traditional",
    description: "Warm, nostalgic pen and ink drawings with watercolor on aged parchment",
    prompt: "Create this in a rustic, traditional art style reminiscent of old European pen and ink drawings with watercolor washes on aged parchment paper. The style should be warm and charming, with a handcrafted feel like something a grandmother would lovingly sketch. Use a muted, earthy color palette with touches of warm browns, soft yellows, and gentle greens. Add subtle textures that suggest the grain of parchment paper and delicate ink lines. The overall effect should be nostalgic and heartwarming, like finding an old recipe book illustration."
  },
  "modern-cookbook": {
    name: "Modern Cookbook",
    description: "Clean, professional food photography style with soft lighting",
    prompt: "Create this in a modern cookbook photography style with clean, professional lighting. Use soft, natural light with subtle shadows to highlight textures and details. The style should be crisp and appetizing with a shallow depth of field effect. Add a hint of styled food photography elements like carefully placed herbs or droplets. The overall effect should be contemporary and magazine-worthy."
  },
  "vintage-poster": {
    name: "Vintage Poster",
    description: "Bold, retro poster art style with vibrant colors",
    prompt: "Create this in a vintage advertising poster style from the 1950s-60s. Use bold, saturated colors and simplified shapes with a slightly textured, printed look. The style should be reminiscent of mid-century commercial art with clean lines and graphic elements. Add subtle halftone patterns and slight misalignment effects to simulate vintage printing. The overall effect should be retro and cheerful."
  },
  "whimsical-cartoon": {
    name: "Whimsical Cartoon",
    description: "Playful, animated style with charming character",
    prompt: "Create this in a whimsical, animated style with exaggerated, friendly features. Use bright, cheerful colors and smooth, rounded shapes. The style should be reminiscent of modern animated films with a touch of Studio Ghibli charm. Add subtle textures and warm lighting effects. The overall effect should be playful and inviting."
  }
} as const;

type ImageStyle = keyof typeof imageStyleOptions;

export default function SettingsPage() {
  // 1) Get current user from AuthContext
  const { user, loading } = useAuth();

  // 2) Local state
  const [username, setUsername] = useState<string>("");
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
  const [preferredCookingOil, setPreferredCookingOil] = useState<string>("");
  const [preferredImageStyle, setPreferredImageStyle] = useState<ImageStyle>("rustic-traditional");

  // For handling the auto-complete filters
  const [dietarySearch, setDietarySearch] = useState("");
  const [oilSearch, setOilSearch] = useState("");

  // Show/Hide dropdown states
  const [showDietaryDropdown, setShowDietaryDropdown] = useState(false);
  const [showOilDropdown, setShowOilDropdown] = useState(false);

  // Tracking when we're actually saving
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
   * Fetch user's data from Firestore on mount
   */
  useEffect(() => {
    if (!user || loading) return;

    const fetchUserSettings = async () => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setUsername(userData.username || "");
          setDietaryPreferences(userData.dietaryPreferences || []);
          setPreferredCookingOil(userData.preferredCookingOil || "");
          setPreferredImageStyle(userData.preferredImageStyle || "rustic-traditional");
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
        username,
        dietaryPreferences,
        preferredCookingOil,
        preferredImageStyle,
      }).catch(async (err) => {
        if (err.code === "not-found") {
          await setDoc(userDocRef, {
            username,
            dietaryPreferences,
            preferredCookingOil,
            preferredImageStyle,
          });
        } else {
          throw err;
        }
      });

      // Also update the spoonPoints document with the new username
      const spoonRef = doc(db, "spoonPoints", user.uid);
      await setDoc(spoonRef, { username }, { merge: true });

    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
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

      <div className="grid grid-cols-1 gap-8">
        {/* Username Section */}
        <div className="p-8 border border-gray-200 rounded-2xl shadow-sm bg-white flex flex-col transition-shadow hover:shadow-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-50 rounded-xl">
              <span className="text-xl">👤</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold">Username</h3>
              <p className="text-sm text-gray-500">
                Choose how you'll appear on the leaderboard.
              </p>
            </div>
          </div>

          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
          />
        </div>

        {/* Image Style Preferences */}
        <div className="p-8 border border-gray-200 rounded-2xl shadow-sm bg-white flex flex-col transition-shadow hover:shadow-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-50 rounded-xl">
              <span className="text-xl">🎨</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold">Image Generation Style</h3>
              <p className="text-sm text-gray-500">
                Choose how Baba should draw images for you.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(imageStyleOptions).map(([key, style]) => (
              <div
                key={key}
                onClick={() => setPreferredImageStyle(key as ImageStyle)}
                className={`p-4 border rounded-xl cursor-pointer transition-all ${
                  preferredImageStyle === key
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200 hover:border-purple-200 hover:bg-purple-50/50"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-4 h-4 rounded-full border ${
                    preferredImageStyle === key
                      ? "border-4 border-purple-500"
                      : "border-gray-300"
                  }`} />
                  <h4 className="font-semibold">{style.name}</h4>
                </div>
                <p className="text-sm text-gray-600 ml-6">{style.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Dietary Preferences */}
        <div className="p-8 border border-gray-200 rounded-2xl shadow-sm bg-white flex flex-col transition-shadow hover:shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-xl">
              <span className="text-xl">🍲</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold">Dietary Preferences</h3>
              <p className="text-sm text-gray-500">
                Select multiple dietary restrictions or preferences.
              </p>
            </div>
          </div>

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
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
            {showDietaryDropdown && filteredDietaryOptions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-200 mt-1 rounded-xl shadow-lg max-h-40 overflow-auto">
                {filteredDietaryOptions.map((option) => (
                  <li
                    key={option}
                    onClick={() => handleSelectDietary(option)}
                    className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors"
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
                className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full text-sm group hover:bg-gray-200 transition-colors"
              >
                <span>{pref}</span>
                <button
                  onClick={() => handleRemoveDietary(pref)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Preferred Cooking Oil */}
        <div className="p-8 border border-gray-200 rounded-2xl shadow-sm bg-white flex flex-col transition-shadow hover:shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-xl">
              <span className="text-xl">🫒</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold">Preferred Cooking Oil</h3>
              <p className="text-sm text-gray-500">
                Select a single cooking oil option.
              </p>
            </div>
          </div>

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
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
            {showOilDropdown && filteredOilOptions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-200 mt-1 rounded-xl shadow-lg max-h-40 overflow-auto">
                {filteredOilOptions.map((oil) => (
                  <li
                    key={oil}
                    onClick={() => handleSelectOil(oil)}
                    className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    {oil}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Save Button - Moved outside the grid */}
      <div className="mt-8 max-w-md mx-auto">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-black text-white px-6 py-3 rounded-xl hover:bg-[#212121] disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Saving...</span>
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </div>
  );
}
