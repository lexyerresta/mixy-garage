"use client"

import React from "react"
import { motion } from "framer-motion"
import { Sparkles, ShoppingBag, Globe, MapPin, Award } from "lucide-react"
import { Product } from "@/app/page"
import { ItemImage } from "@/components/ItemImage"

interface GradingSectionProps {
    title: string
    subtitle: string
    icon: React.ReactNode
    items: Product[]
    onCardClick: (p: Product) => void
    isLocal?: boolean
}

const formatRupiah = (value: number): string =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value)

export const GradingSection: React.FC<GradingSectionProps> = ({
    title,
    subtitle,
    icon,
    items,
    onCardClick,
    isLocal = false
}) => {
    if (items.length === 0) return null

    return (
        <section className="relative py-12">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 px-2">
                <div className="flex items-center gap-6">
                    <div className={`p-5 rounded-[2rem] ${isLocal ? 'bg-vault-cyan/10 text-vault-cyan' : 'bg-vault-gold/10 text-vault-gold'} border border-current/20 backdrop-blur-sm shadow-xl`}>
                        {React.cloneElement(icon as React.ReactElement<any>, { size: 40 })}
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`w-12 h-0.5 ${isLocal ? 'bg-vault-cyan/40' : 'bg-vault-gold/40'}`} />
                            <h2 className="text-sm font-black text-slate-400 dark:text-vault-gold uppercase tracking-[0.6em]">{title} ARCHIVES</h2>
                        </div>
                        <h3 className="text-3xl sm:text-5xl font-black italic text-slate-900 dark:text-white uppercase tracking-tighter leading-none">
                            {isLocal ? 'DOMESTIC' : 'GLOBAL'} <span className={isLocal ? 'text-vault-cyan' : 'text-vault-gold'}>AUTHENTICATION</span>
                        </h3>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mt-3">{subtitle}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-10">
                {items.slice(0, 4).map((p, i) => (
                    <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => onCardClick(p)}
                        className="group tcg-slab"
                    >
                        <div className="relative aspect-[3/4] mb-6 vault-screen flex items-center justify-center p-6 group-hover:scale-[1.02] transition-transform duration-500 vault-holo">
                            <ItemImage itemName={p.name} className="scale-100 group-hover:scale-110 transition-transform duration-700 blur-0" />
                            <div className={`absolute top-4 right-4 px-3 py-1 ${isLocal ? 'bg-vault-cyan text-black' : 'bg-vault-gold text-black'} text-[9px] font-black rounded-lg shadow-lg uppercase tracking-widest flex items-center gap-1.5`}>
                                <Award size={12} />
                                {p.condition?.split(' ')[0] || 'GRADE'}
                            </div>
                        </div>

                        <div className="px-1 flex flex-col items-center text-center">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-[10px] font-black text-vault-gold uppercase tracking-[0.3em] font-mono">{p.subcategory}</span>
                                {p.condition && (
                                    <>
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-white/10" />
                                        <span className="px-2 py-0.5 bg-vault-gold/10 text-vault-gold text-[9px] font-black rounded border border-vault-gold/20 uppercase">
                                            {p.condition}
                                        </span>
                                    </>
                                )}
                            </div>

                            <h4 className="font-black text-sm mb-6 text-slate-900 dark:text-zinc-100 uppercase italic line-clamp-1 leading-tight group-hover:text-vault-accent transition-colors w-full px-2">
                                {p.name}
                            </h4>

                            <div className="flex flex-col items-center">
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">Market Valuation</p>
                                <span className="font-black text-2xl text-vault-accent italic tracking-tighter">
                                    {formatRupiah(p.price).replace(",00", "")}
                                </span>
                            </div>
                        </div>

                        {/* Decorative Card Numbering */}
                        <div className="absolute bottom-4 left-6 text-[8px] font-black text-slate-200 dark:text-white/5 uppercase tracking-[0.4em] pointer-events-none italic">
                            VAULT NO. {i + 1}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Visual Separator */}
            <div className="mt-16 w-full h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent" />
        </section>
    )
}
