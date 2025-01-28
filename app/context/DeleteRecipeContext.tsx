"use client";

import React, { createContext, useContext, useState } from 'react';
import { DeleteRecipePopup } from '../components/DeleteRecipePopup';

interface DeleteRecipeContextType {
  showDeletePopup: (id: string, title: string, onConfirm: () => void) => void;
}

const DeleteRecipeContext = createContext<DeleteRecipeContextType | null>(null);

export const useDeleteRecipe = () => {
  const context = useContext(DeleteRecipeContext);
  if (!context) {
    throw new Error('useDeleteRecipe must be used within a DeleteRecipeProvider');
  }
  return context;
};

export const DeleteRecipeProvider = ({ children }: { children: React.ReactNode }) => {
  const [deleteRecipe, setDeleteRecipe] = useState<{
    id: string;
    title: string;
    onConfirm: () => void;
  } | null>(null);

  const showDeletePopup = (id: string, title: string, onConfirm: () => void) => {
    setDeleteRecipe({ id, title, onConfirm });
  };

  return (
    <DeleteRecipeContext.Provider value={{ showDeletePopup }}>
      {children}
      <DeleteRecipePopup
        isOpen={deleteRecipe !== null}
        onClose={() => setDeleteRecipe(null)}
        onConfirm={() => {
          if (deleteRecipe) {
            deleteRecipe.onConfirm();
            setDeleteRecipe(null);
          }
        }}
        recipeName={deleteRecipe?.title || ""}
      />
    </DeleteRecipeContext.Provider>
  );
}; 