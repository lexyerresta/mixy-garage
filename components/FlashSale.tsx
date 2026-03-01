"use client"

import { motion } from "framer-motion"
import { Zap, Clock, ShoppingBag } from "lucide-react"
import { ItemImage } from "./ItemImage"
import React from 'react'

type Product = {
    id: string
    name: string
    category: string
    subcategory: string | null
    qty: number
    price: number
    originalPrice?: number
    isFlashSale?: boolean
}

interface FlashSaleProps {
    products: Product[]
    flashSaleItems: Product[]
    timeLeft: string
    onCardClick: (product: Product) => void
    onAddToCart: (product: Product, e?: React.MouseEvent) => void
    onBuyNow: (product: Product, e?: React.MouseEvent) => void
}

const formatRupiah = (value: number): string =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value)

const getRarityStyle = (price: number): string => {
    if (price >= 1000000) return "shadow-[0_0_25px_rgba(255,165,0,0.4)] border-orange-500 border-2"
    if (price >= 500000) return "shadow-[0_0_15px_rgba(255,165,0,0.2)] border-orange-400 border"
    return "border-slate-200 dark:border-white/10"
}

export const FlashSale: React.FC<FlashSaleProps> = ({ flashSaleItems, timeLeft, onCardClick, onAddToCart, onBuyNow }) => {

    if (flashSaleItems.length === 0) return null

    return (
        <section className="mb-10 relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl blur-sm opacity-20 group-hover:opacity-40 transition duration-1000" />

            <div className="relative bg-white dark:bg-[#151e32] rounded-xl p-4 border border-orange-100 dark:border-white/10 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="relative bg-gradient-to-br from-orange-500 to-red-600 p-2 rounded-xl text-white transform -rotate-3 shadow-lg">
                            <Zap size={24} className="fill-yellow-300 text-yellow-300" />
                        </div>
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white leading-none">Flash <span className="text-red-600">Sale</span></h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Exclusive daily deals. Ends soon!</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/10 px-4 py-2 rounded-lg border border-red-100 dark:border-red-900/20">
                        <Clock size={18} className="text-red-600 dark:text-red-400" />
                        <span className="font-mono font-black text-xl text-red-600 dark:text-red-400">{timeLeft}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {flashSaleItems.map((item: Product, index: number) => (
                        <motion.div
                            key={`flash-${item.id}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => onCardClick(item)}
                            className={`group/card relative bg-white dark:bg-[#0B1120] rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden cursor-pointer transition-all ${getRarityStyle(item.price)}`}
                        >
                            <div className="absolute top-0 right-0 z-20 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-bl-lg">-11%</div>

                            <div className="relative aspect-square bg-slate-50 dark:bg-[#151e32] p-4 flex items-center justify-center">
                                <ItemImage itemName={item.name} className="w-full h-full object-contain group-hover/card:scale-110 transition-transform duration-500" />
                            </div>

                            <div className="p-3">
                                <h3 className="font-bold text-xs truncate mb-2 text-slate-900 dark:text-white">{item.name}</h3>
                                <div className="flex flex-col mb-3">
                                    <span className="text-[10px] text-slate-400 line-through tracking-tighter">{formatRupiah(item.originalPrice || 0)}</span>
                                    <span className="text-lg font-black text-red-600 dark:text-red-500 leading-none">{formatRupiah(item.price).replace(",00", "")}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={(e: React.MouseEvent) => { e.stopPropagation(); onBuyNow(item, e); }} className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-black transition-colors">BUY</button>
                                    <button onClick={(e: React.MouseEvent) => { e.stopPropagation(); onAddToCart(item, e); }} className="p-1.5 bg-slate-100 dark:bg-white/10 rounded-lg text-slate-500 dark:text-slate-300 hover:text-orange-600 transition-colors"><ShoppingBag size={14} /></button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
