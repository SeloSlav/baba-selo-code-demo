import Link from "next/link";

export const UpgradeButton = () => {
    return (
        <Link href="/upgrade" className="block group">
            <div className="bg-black text-white p-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg relative overflow-hidden">
                {/* Gradient overlay - visible on mobile, transitions on hover for desktop */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-40 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative z-10">
                    <div className="flex flex-col gap-2 mb-2">
                        <span className="text-lg font-semibold">Upgrade to Pro</span>
                    </div>
                    <p className="text-sm text-gray-200 mb-2">Voice chat, meal plans & more</p>
                    <div className="flex items-center justify-between text-xs text-gray-300">
                        <span>Starting at $8/month</span>
                        <span className="flex items-center gap-1">
                            Upgrade now <span className="text-purple-400">→</span>
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}; 