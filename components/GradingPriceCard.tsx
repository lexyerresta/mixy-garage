import React from "react"
import { Clock, Info, ShieldCheck, AlertCircle } from "lucide-react"

interface PriceRule {
    label: string
    value: string
}

interface GradingPriceCardProps {
    title: string
    subtitle: string
    estimate: string
    maxValue: string
    price: string
    bulkPrices?: PriceRule[]
    notes?: string[]
    isFeatured?: boolean
}

export const GradingPriceCard: React.FC<GradingPriceCardProps> = ({
    title,
    subtitle,
    estimate,
    maxValue,
    price,
    bulkPrices,
    notes,
    isFeatured = false,
}) => {
    return (
        <div className={`relative group p-8 rounded-[2.5rem] border-2 transition-all duration-500 flex flex-col h-full bg-white dark:bg-vault-charcoal hover:translate-y-[-8px] ${isFeatured
                ? "border-vault-accent shadow-[0_20px_50px_rgba(255,0,85,0.15)] ring-4 ring-vault-accent/5"
                : "border-slate-200 dark:border-white/10 shadow-xl hover:border-vault-accent/30"
            }`}>
            {isFeatured && (
                <div className="absolute -top-4 left-10 px-4 py-1 bg-vault-accent text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg">
                    Best Value
                </div>
            )}

            <div className="mb-6">
                <h3 className={`text-2xl font-black italic uppercase tracking-tighter mb-1 ${isFeatured ? "text-vault-accent" : "text-slate-900 dark:text-white"}`}>
                    {title}
                </h3>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    {subtitle}
                </p>
            </div>

            <div className="space-y-5 flex-grow">
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5">
                    <Clock size={16} className="text-vault-accent mt-0.5 shrink-0" />
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Estimated TAT</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{estimate}</p>
                    </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5">
                    <ShieldCheck size={16} className="text-vault-cyan mt-0.5 shrink-0" />
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Max Declared Value</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{maxValue}</p>
                    </div>
                </div>

                <div className="py-4">
                    <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-1">
                        {price}
                        <span className="text-xs text-slate-400 font-bold ml-1 uppercase tracking-tighter">/ Card</span>
                    </p>

                    {bulkPrices && bulkPrices.length > 0 && (
                        <div className="mt-3 space-y-1">
                            {bulkPrices.map((rule, idx) => (
                                <div key={idx} className="flex justify-between items-center text-[10px] font-black uppercase tracking-tight text-slate-500">
                                    <span>{rule.label}</span>
                                    <span className="text-vault-accent">{rule.value}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {notes && notes.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/5 flex flex-col gap-2">
                    {notes.map((note, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                            <AlertCircle size={12} className="text-slate-400 mt-0.5 shrink-0" />
                            <p className="text-[10px] font-medium text-slate-500 leading-relaxed italic">{note}</p>
                        </div>
                    ))}
                </div>
            )}

            <button className={`mt-8 w-full py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all active:scale-95 ${isFeatured
                    ? "bg-vault-accent text-white shadow-lg shadow-vault-accent/20 hover:shadow-vault-accent/40"
                    : "bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-vault-accent hover:text-white"
                }`}>
                Select Tier
            </button>
        </div>
    )
}
