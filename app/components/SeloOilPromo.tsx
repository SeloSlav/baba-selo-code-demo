import Link from "next/link";

export const SeloOilPromo = () => {
    return (
        <a 
            href="https://seloolive.com/products/authentic-croatian-olive-oil?variant=40790542549035" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="block group"
        >
            <div className="bg-black text-white p-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg relative overflow-hidden">
                {/* Gradient overlay - visible on mobile, transitions on hover for desktop */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-yellow-600 opacity-40 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative z-10">
                    <div className="flex flex-col gap-2 mb-2">
                        <span className="text-lg font-semibold">Try Selo Olive Oil</span>
                    </div>
                    <p className="text-sm text-gray-200 mb-2">Authentic Croatian extra virgin olive oil</p>
                    <div className="flex items-center justify-between text-xs text-gray-300">
                        <span>From the Erlić family estate</span>
                        <span className="flex items-center gap-1">
                            Shop now <span className="text-yellow-400">→</span>
                        </span>
                    </div>
                </div>
            </div>
        </a>
    );
}; 