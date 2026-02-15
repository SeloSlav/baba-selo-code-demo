import Link from "next/link";

export const SeloOilPromo = () => {
    return (
        <a 
            href="https://seloolive.com/products/authentic-croatian-olive-oil?variant=40790542549035" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="block group"
        >
            <div 
                className="relative min-h-[140px] p-5 rounded-xl overflow-hidden transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                style={{
                    backgroundImage: "url('/secret-ingredient-bg.png')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            >
                {/* Dark overlay for text readability - slightly lighter on hover for more image peek-through */}
                <div className="absolute inset-0 bg-black/65 group-hover:bg-black/55 transition-colors duration-300" />
                
                {/* Subtle emerald tint overlay for brand cohesion */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-transparent to-amber-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Border glow on hover */}
                <div className="absolute inset-0 rounded-xl border border-white/10 group-hover:border-emerald-400/30 group-hover:shadow-[inset_0_0_30px_rgba(52,211,153,0.1)] transition-all duration-300 pointer-events-none" />
                
                <div className="relative z-10">
                    <div className="flex flex-col gap-2 mb-2">
                        <span className="text-lg font-semibold text-white group-hover:text-emerald-200 transition-colors duration-300 drop-shadow-sm">Baba&apos;s Secret Ingredient</span>
                    </div>
                    <p className="text-sm text-gray-200 group-hover:text-white/95 transition-colors duration-300 drop-shadow-sm">Hand-picked Croatian olive oil from our family grove. Pure, unblended, magical.</p>
                    <div className="flex items-center justify-between text-xs mt-3">
                        <span className="flex items-center gap-1 text-emerald-200/90 group-hover:text-emerald-200 group-hover:translate-x-0.5 transition-all duration-300">
                            Taste the tradition <span className="text-amber-300 group-hover:text-amber-200 group-hover:translate-x-1 transition-all duration-300">→</span>
                        </span>
                    </div>
                </div>
            </div>
        </a>
    );
}; 