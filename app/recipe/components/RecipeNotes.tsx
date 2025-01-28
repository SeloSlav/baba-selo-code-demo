"use client";

import { Recipe } from "../types";
import { RefObject } from "react";
import { LoadingSpinner } from "../../components/LoadingSpinner";

interface RecipeNotesProps {
  recipe: Recipe;
  isOwner: boolean;
  notes: string;
  savingNotes: boolean;
  hasNoteChanges: boolean;
  notesRef: RefObject<HTMLDivElement>;
  setNotes: (notes: string) => void;
  setHasNoteChanges: (hasChanges: boolean) => void;
  handleSaveNotes: () => void;
}

export const RecipeNotes = ({
  recipe,
  isOwner,
  notes,
  savingNotes,
  hasNoteChanges,
  notesRef,
  setNotes,
  setHasNoteChanges,
  handleSaveNotes,
}: RecipeNotesProps) => {
  return (
    <div ref={notesRef} className="mb-6">
      <h3 className="text-xl font-semibold mb-2">
        <span className="mr-2">📝</span>
        Notes
      </h3>
      <div className="relative">
        {isOwner ? (
          <>
            <textarea
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setHasNoteChanges(true);
              }}
              placeholder="Add your recipe notes here..."
              className="w-full min-h-[150px] p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            />
            {hasNoteChanges && (
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="absolute top-2 right-2 bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingNotes ? (
                  <div className="flex items-center">
                    <LoadingSpinner className="mr-2" />
                    Saving...
                  </div>
                ) : (
                  'Save Notes'
                )}
              </button>
            )}
          </>
        ) : recipe.recipeNotes ? (
          <div className="bg-gray-100 p-4 rounded-lg whitespace-pre-wrap">
            {recipe.recipeNotes}
          </div>
        ) : (
          <div className="text-gray-500 italic">No notes added yet.</div>
        )}
      </div>
    </div>
  );
}; 