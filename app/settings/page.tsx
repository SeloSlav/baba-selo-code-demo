"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
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
  "social-snap": {
    name: "Social Snap",
    description: "Modern social media style with vibrant, crisp details",
    prompt: "Create this in a modern social media photography style. Use bright, even lighting with enhanced dynamic range to capture rich details and textures. Frame the shot from a slightly elevated angle with a lifestyle-focused composition. The colors should be vibrant yet natural, with crisp details and subtle depth of field. Add gentle highlights to create an appetizing glow, making the food look fresh and inviting. The overall effect should feel contemporary and shareable, like a professional food influencer's content."
  },
  "whimsical-cartoon": {
    name: "Whimsical Cartoon",
    description: "Playful, animated style with charming character",
    prompt: "Create this in a whimsical, animated style with exaggerated, friendly features. Use bright, cheerful colors and smooth, rounded shapes. The style should be reminiscent of modern animated films with a touch of Studio Ghibli charm. Add subtle textures and warm lighting effects. The overall effect should be playful and inviting."
  }
} as const;

type ImageStyle = keyof typeof imageStyleOptions;

export default function SettingsPage() {
  const { user, loading } = useAuth();

  // Local state
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

  // Save states
  const [isSaving, setIsSaving] = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Refs for closing dropdown on outside click
  const dietaryRef = useRef<HTMLDivElement>(null);
  const oilRef = useRef<HTMLDivElement>(null);

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

  /**
   * Filtered options
   */
  const filteredDietaryOptions = dietaryOptions.filter((opt) =>
    opt.toLowerCase().includes(dietarySearch.toLowerCase())
  );
  const filteredOilOptions = cookingOilOptions.filter((oil) =>
    oil.toLowerCase().includes(oilSearch.toLowerCase())
  );

  // Auto-save function for non-username settings
  const autoSave = async (updates: Partial<{
    dietaryPreferences: string[];
    preferredCookingOil: string;
    preferredImageStyle: ImageStyle;
  }>) => {
    if (!user) return;

    setIsSaving(true);
    setError(null);
    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, updates).catch(async (err) => {
        if (err.code === "not-found") {
          await setDoc(userDocRef, updates);
        } else {
          throw err;
        }
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error("Error saving settings:", err);
      setError("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Debounced auto-save
  const debouncedSave = useCallback((updates: Parameters<typeof autoSave>[0]) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      autoSave(updates);
    }, 500);
  }, [user]);

  // Handle username save separately
  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSavingUsername(true);
    setError(null);
    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, { username });
      
      // Also update the spoonPoints document with the new username
      const spoonRef = doc(db, "spoonPoints", user.uid);
      await setDoc(spoonRef, { username }, { merge: true });
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error("Error saving username:", err);
      setError("Failed to save username. Please try again.");
    } finally {
      setSavingUsername(false);
    }
  };

  // Modified handlers to include auto-save
  const handleSelectDietary = (option: string) => {
    if (!dietaryPreferences.includes(option)) {
      const newPreferences = [...dietaryPreferences, option];
      setDietaryPreferences(newPreferences);
      debouncedSave({ dietaryPreferences: newPreferences });
    }
    setDietarySearch("");
    setShowDietaryDropdown(false);
  };

  const handleRemoveDietary = (option: string) => {
    const newPreferences = dietaryPreferences.filter((item) => item !== option);
    setDietaryPreferences(newPreferences);
    debouncedSave({ dietaryPreferences: newPreferences });
  };

  const handleSelectOil = (oil: string) => {
    setPreferredCookingOil(oil);
    setOilSearch(oil);
    setShowOilDropdown(false);
    debouncedSave({ preferredCookingOil: oil });
  };

  const handleRemoveOil = () => {
    setPreferredCookingOil("");
    setOilSearch("");
    debouncedSave({ preferredCookingOil: "" });
  };

  const handleImageStyleChange = (style: ImageStyle) => {
    setPreferredImageStyle(style);
    debouncedSave({ preferredImageStyle: style });
  };

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

      {/* Save Status Indicator */}
      {(isSaving || saveSuccess) && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 ${
          isSaving ? "bg-gray-800 text-white" : "bg-green-600 text-white"
        }`}
        style={{ 
          opacity: isSaving || saveSuccess ? 1 : 0,
          transform: `translateY(${isSaving || saveSuccess ? '0' : '100%'})`,
          transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out'
        }}>
          {isSaving ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Saving changes...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>✓</span>
              <span>Changes saved</span>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="fixed bottom-4 right-4 p-4 bg-red-600 text-white rounded-lg shadow-lg z-50"
          style={{ 
            opacity: error ? 1 : 0,
            transform: `translateY(${error ? '0' : '100%'})`,
            transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out'
          }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8">
        {/* Username Section */}
        <div className="p-8 border border-gray-200 rounded-2xl shadow-sm bg-white flex flex-col transition-shadow hover:shadow-md">
          <form onSubmit={handleUsernameSubmit}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-50 rounded-xl">
                <span className="text-xl">👤</span>
              </div>
              <div className="flex-grow">
                <h3 className="text-2xl font-bold">Username</h3>
                <p className="text-sm text-gray-500">
                  Choose how you'll appear on the leaderboard.
                </p>
              </div>
              <button
                type="submit"
                disabled={savingUsername}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2
                  ${savingUsername
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-black text-white hover:bg-[#212121]"
                  }`}
              >
                {savingUsername ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  "Save"
                )}
              </button>
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
            />
          </form>
        </div>

        {/* Image Style Preferences */}
        <div className="p-8 border border-gray-200 rounded-2xl shadow-sm bg-white flex flex-col transition-shadow hover:shadow-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-50 rounded-xl">
              <span className="text-xl">🎨</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold">Recipe Image Style</h3>
              <p className="text-sm text-gray-500">
                Choose how Baba should generate images of your recipes when you save them.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(imageStyleOptions).map(([key, style]) => (
              <div
                key={key}
                onClick={() => {
                  setPreferredImageStyle(key as ImageStyle);
                  debouncedSave({ preferredImageStyle: key as ImageStyle });
                }}
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
                className="flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-full text-sm"
              >
                <span>{pref}</span>
                <button
                  onClick={() => {
                    const newPreferences = dietaryPreferences.filter(item => item !== pref);
                    setDietaryPreferences(newPreferences);
                    debouncedSave({ dietaryPreferences: newPreferences });
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ×
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

          {/* Selected oil tag */}
          {preferredCookingOil && (
            <div className="flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-full text-sm w-fit">
              <span>{preferredCookingOil}</span>
              <button
                onClick={() => {
                  setPreferredCookingOil("");
                  setOilSearch("");
                  debouncedSave({ preferredCookingOil: "" });
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
