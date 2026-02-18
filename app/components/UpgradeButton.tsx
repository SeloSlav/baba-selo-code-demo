import Link from "next/link";

export const UpgradeButton = () => {
    return (
        <Link href="/upgrade" className="block group">
            <div className="bg-amber-600 text-white p-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-amber-900/25 relative overflow-hidden hover:bg-amber-700">
                
                <div className="relative z-10">
                    <div className="flex flex-col gap-2 mb-2">
                        <span className="text-lg font-semibold">Upgrade to Pro</span>
                    </div>
                    <p className="text-sm text-amber-100 mb-2">Baba remembers, keep all chats, meal plans</p>
                    <div className="flex items-center justify-between text-xs text-amber-100/90">
                        <span>Starting at $8/month</span>
                        <span className="flex items-center gap-1">
                            Upgrade now <span className="text-amber-200">→</span>
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}; 