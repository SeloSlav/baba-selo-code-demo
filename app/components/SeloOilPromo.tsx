import Link from "next/link";

export const SeloOilPromo = () => {
    return (
        <a 
            href="https://seloolive.com/products/authentic-croatian-olive-oil?variant=40790542549035" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="block group"
        >
            <div className="bg-gradient-to-br from-slate-900 to-zinc-900 text-white p-5 rounded-xl transition-all duration-300 transform hover:scale-[1.03] active:scale-[0.98] shadow-lg relative overflow-hidden hover:shadow-xl">
                {/* Gradient overlay - visible on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-800 via-olive-600 to-amber-700 opacity-20 md:group-hover:opacity-40 transition-opacity duration-500"></div>
                
                {/* Subtle border glow effect on hover */}
                <div className="absolute inset-0 rounded-xl border border-emerald-600/20 md:group-hover:border-emerald-500/50 md:group-hover:shadow-[inset_0_0_20px_rgba(52,211,153,0.2)] transition-all duration-500"></div>
                
                <div className="relative z-10">
                    <div className="flex flex-col gap-2 mb-2">
                        <span className="text-lg font-semibold group-hover:text-emerald-300 transition-colors duration-300">Baba's Secret Ingredient</span>
                    </div>
                    <p className="text-sm text-gray-200 mb-3 group-hover:text-white transition-colors duration-300">Hand-picked Croatian olive oil from our family grove. Pure, unblended, magical.</p>
                    <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 group-hover:text-emerald-300 transition-colors duration-300">
                            Taste the tradition <span className="text-amber-400 group-hover:text-amber-300 group-hover:translate-x-1 transition-all duration-300">→</span>
                        </span>
                    </div>
                </div>
            </div>
        </a>
    );
}; 