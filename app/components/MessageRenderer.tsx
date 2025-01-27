import React from 'react';
import { RecipeClassification } from './types';
import { RecipeMessage } from './RecipeMessage';
import {
    renderMarkdown,
    renderNutritionInfo,
    renderDiscountButton,
    linkifyLastSelo,
    renderDishPairingLinks
} from './messageUtils';

interface MessageRendererProps {
    message: {
        role: "user" | "assistant";
        content: string;
    };
    index: number;
    messageRef: React.RefObject<HTMLDivElement> | null;
    recipeClassification?: RecipeClassification | null;
    formattedPairings: Record<number, string>;
    onSuggestionClick: (suggestion: string) => void;
    onAssistantResponse: (assistantMsg: string) => void;
    setLoading: (loading: boolean) => void;
    handleSaveRecipe: (content: string, classification: RecipeClassification | null) => void;
}

// Helper functions
const isCalorieInfo = (data: any) => {
    return (
        typeof data === "object" &&
        data.total &&
        data.per_serving &&
        typeof data.total.calories === "number" &&
        typeof data.per_serving.calories === "number"
    );
};

const isRecipe = (text: string) => {
    return text.toLowerCase().includes("ingredients") && text.toLowerCase().includes("directions");
};

const isAboutSeloOliveOil = (text: string): boolean => {
    return text.toLowerCase().includes("selo olive oil");
};

const isSelo = (text: string): boolean => {
    return text.toLowerCase().includes("selo olive oil");
};

// Subcomponents for different message types
const UserMessage: React.FC<{ content: string }> = ({ content }) => (
    <div className="flex justify-end">
        <div className="bg-[#0284FE] text-white px-5 py-2.5 rounded-3xl max-w-xs whitespace-pre-line">
            {content}
        </div>
    </div>
);

const LinkedMessage: React.FC<{ content: string; messageRef: React.RefObject<HTMLDivElement> | null }> = ({ content, messageRef }) => (
    <div ref={messageRef} className="flex items-start space-x-2">
        <div
            className="bg-[#F3F3F3] text-[#0d0d0d] px-5 py-2.5 rounded-3xl"
            dangerouslySetInnerHTML={{ __html: content }}
        />
    </div>
);

const CalorieMessage: React.FC<{ content: any; messageRef: React.RefObject<HTMLDivElement> | null }> = ({ content, messageRef }) => (
    <div ref={messageRef} className="flex items-start space-x-2">
        {renderNutritionInfo(content)}
    </div>
);

const SeloMessage: React.FC<{ content: string; messageRef: React.RefObject<HTMLDivElement> | null }> = ({ content, messageRef }) => (
    <div ref={messageRef} className="flex items-start space-x-2">
        <div className="bg-[#F3F3F3] text-[#0d0d0d] px-5 py-2.5 rounded-3xl">
            {renderMarkdown(content)}
            {renderDiscountButton()}
        </div>
    </div>
);

export const MessageRenderer: React.FC<MessageRendererProps> = ({
    message,
    index,
    messageRef,
    recipeClassification,
    formattedPairings,
    onSuggestionClick,
    onAssistantResponse,
    setLoading,
    handleSaveRecipe
}) => {
    if (message.role === "user") {
        return <UserMessage content={message.content} />;
    }

    if (message.role === "assistant") {
        if (/<a .*?<\/a>/i.test(message.content)) {
            return <LinkedMessage content={message.content} messageRef={messageRef} />;
        }

        if (isCalorieInfo(message.content)) {
            return <CalorieMessage content={message.content} messageRef={messageRef} />;
        }

        if (isAboutSeloOliveOil(message.content)) {
            return <SeloMessage content={message.content} messageRef={messageRef} />;
        }

        if (isSelo(message.content)) {
            return (
                <div ref={messageRef} className="flex items-start space-x-2">
                    <div className="bg-[#F3F3F3] text-[#0d0d0d] px-5 py-2.5 rounded-3xl">
                        {linkifyLastSelo(message.content)}
                    </div>
                </div>
            );
        }

        if (isRecipe(message.content)) {
            return <RecipeMessage 
                content={message.content}
                messageRef={messageRef}
                classification={recipeClassification || null}
                onSuggestionClick={onSuggestionClick}
                onAssistantResponse={onAssistantResponse}
                setLoading={setLoading}
                handleSaveRecipe={handleSaveRecipe}
            />;
        }

        if (message.content.includes("pairing") || message.content.includes("complement")) {
            return (
                <div ref={messageRef} className="flex items-start space-x-2">
                    <div className="bg-[#F3F3F3] text-[#0d0d0d] px-5 py-2.5 rounded-3xl">
                        {renderDishPairingLinks(formattedPairings[index] || message.content, onSuggestionClick)}
                    </div>
                </div>
            );
        }

        return (
            <div ref={messageRef} className="flex items-start space-x-2">
                <div className="bg-[#F3F3F3] text-[#0d0d0d] px-5 py-2.5 rounded-3xl">
                    {renderMarkdown(message.content)}
                </div>
            </div>
        );
    }

    return null;
}; 