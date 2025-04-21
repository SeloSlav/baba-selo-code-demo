import React from 'react';

export const renderMarkdown = (text: string): React.ReactNode => {
    // First handle images with markdown syntax ![alt](url)
    const parts = text.split(/(!?\[.*?\]\(.*?\))/);
    
    return parts.map((part, index) => {
        // Check if this part is an image markdown
        if (part.match(/^!\[.*?\]\(.*?\)$/)) {
            const [, alt, url] = part.match(/^!\[(.*?)\]\((.*?)\)$/) || [];
            return (
                <div key={index} className="my-4">
                    <img 
                        src={url} 
                        alt={alt} 
                        className="rounded-xl max-w-full h-auto shadow-lg"
                        loading="lazy"
                    />
                </div>
            );
        }
        
        // Handle regular bold text for the remaining parts
        const boldParts = part.split(/(\*\*.*?\*\*)/);
        return boldParts.map((boldPart, boldIndex) => {
            if (boldPart.startsWith("**") && boldPart.endsWith("**")) {
                const trimmedPart = boldPart.slice(2, -2).trim();
                const nextPart = boldParts[boldIndex + 1] || "";
                const endsWithPunctuation = nextPart.startsWith(".") || nextPart.startsWith(",") || nextPart.startsWith("!");

                return (
                    <React.Fragment key={`${index}-${boldIndex}`}>
                        {boldIndex > 0 && !boldParts[boldIndex - 1].endsWith(" ") && " "}
                        <strong className="font-semibold">{trimmedPart}</strong>
                        {boldIndex < boldParts.length - 1 && !endsWithPunctuation && !nextPart.startsWith(" ") && " "}
                    </React.Fragment>
                );
            }
            return boldPart;
        });
    });
};

export const renderNutritionInfo = (macros: any) => {
    if (!macros || !macros.total || !macros.per_serving) {
        return <div>No macro information available.</div>;
    }

    return (
        <div className="p-4 bg-gray-50 rounded-lg shadow border border-gray-300">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Nutritional Breakdown</h3>
            
            {macros.servings && (
                <div className="mb-4 text-sm text-gray-600">
                    <p className="font-semibold">Number of Servings: {macros.servings}</p>
                </div>
            )}

            {/* Total Recipe */}
            <div className="mb-4">
                <h4 className="text-md font-semibold text-gray-700 mb-2">Total Recipe</h4>
                <div className="space-y-1 text-sm text-gray-600">
                    <p className="flex justify-between">
                        <span>Calories:</span>
                        <span className="font-medium">{macros.total.calories} kcal</span>
                    </p>
                    <p className="flex justify-between">
                        <span>Proteins:</span>
                        <span className="font-medium">{macros.total.proteins} g</span>
                    </p>
                    <p className="flex justify-between">
                        <span>Carbohydrates:</span>
                        <span className="font-medium">{macros.total.carbs} g</span>
                    </p>
                    <p className="flex justify-between">
                        <span>Fats:</span>
                        <span className="font-medium">{macros.total.fats} g</span>
                    </p>
                </div>
            </div>

            {/* Per Serving */}
            <div>
                <h4 className="text-md font-semibold text-gray-700 mb-2">Per Serving</h4>
                <div className="space-y-1 text-sm text-gray-600">
                    <p className="flex justify-between">
                        <span>Calories:</span>
                        <span className="font-medium">{macros.per_serving.calories} kcal</span>
                    </p>
                    <p className="flex justify-between">
                        <span>Proteins:</span>
                        <span className="font-medium">{macros.per_serving.proteins} g</span>
                    </p>
                    <p className="flex justify-between">
                        <span>Carbohydrates:</span>
                        <span className="font-medium">{macros.per_serving.carbs} g</span>
                    </p>
                    <p className="flex justify-between">
                        <span>Fats:</span>
                        <span className="font-medium">{macros.per_serving.fats} g</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export const renderDiscountButton = () => (
    <div className="mt-4">
        <a
            href="https://seloolive.com/discount/BABASELO10?redirect=/products/authentic-croatian-olive-oil?variant=40790542549035"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center px-5 py-3 bg-gradient-to-r from-teal-600 to-teal-500 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
        >
            <span className="relative z-10 flex flex-col items-start">
                <span className="font-semibold">Get 10% Off Selo Olive Oil</span>
                <span className="text-xs text-teal-100 mt-0.5">Authentic Croatian • Cold-Pressed</span>
            </span>
            <span className="ml-3 group-hover:translate-x-1 transition-transform duration-300">→</span>
        </a>
    </div>
);

export const linkifyLastSelo = (text: string): React.ReactNode => {
    const target = "selo olive oil";
    const lower = text.toLowerCase();
    const lastIndex = lower.lastIndexOf(target);

    if (lastIndex === -1) return text;

    return (
        <>
            {text.substring(0, lastIndex)}
            <a
                href="https://seloolive.com/products/authentic-croatian-olive-oil?variant=40790542549035"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
            >
                {text.substring(lastIndex, lastIndex + target.length)}
            </a>
            {text.substring(lastIndex + target.length)}
        </>
    );
};

export const renderDishPairingLinks = (text: string, onSuggestionClick: (suggestion: string) => void): React.ReactNode => {
    const boldRegex = /[*_]{2}(.*?)[*_]{2}/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }

        const boldText = match[1];
        parts.push(
            <button
                key={match.index}
                onClick={() => onSuggestionClick(`Give me a recipe for ${boldText}`)}
                className="font-bold text-blue-600 hover:underline cursor-pointer"
            >
                {boldText}
            </button>
        );

        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }

    return <>{parts}</>;
};

export const linkifyOliveOil = (text: string): React.ReactNode => {
    const target = "olive oil";
    const lower = text.toLowerCase();
    const index = lower.indexOf(target);
    if (index === -1) return text;

    return (
        <>
            {text.substring(0, index)}
            <a
                href="https://seloolive.com/products/authentic-croatian-olive-oil?variant=40790542549035"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
            >
                {text.substring(index, index + target.length)}
            </a>
            {text.substring(index + target.length)}
        </>
    );
};

export const parseRecipe = (text: string) => {
    const lines = text.split("\n").map(line => line.trim()).filter(line => line !== "");
    const ingredientsIndex = lines.findIndex(line => line.toLowerCase() === "ingredients");
    const directionsIndex = lines.findIndex(line => line.toLowerCase() === "directions");

    if (ingredientsIndex === -1 || directionsIndex === -1) {
        return { title: text, ingredients: [], directions: [] };
    }

    const title = lines[0];
    const ingredients = lines.slice(ingredientsIndex + 1, directionsIndex).map(ing => ing.replace(/^-+\s*/, ''));
    const directions = lines.slice(directionsIndex + 1).map(dir => dir.replace(/^([0-9]+\.\s*)+/, '').replace(/^-+\s*/, ''));

    return { title, ingredients, directions };
};

export const isRecipe = (text: string) => {
    return (
        typeof text === "string" &&
        text.toLowerCase().includes("ingredients") &&
        text.toLowerCase().includes("directions")
    );
}; 