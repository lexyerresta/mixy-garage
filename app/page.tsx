"use client"

import React, { useEffect, useState, useMemo, Suspense } from "react"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Filter,
  ShoppingBag,
  Sparkles,
  X,
  Trash2,
  ChevronDown,
  Sun,
  Moon,
  Car,
  Layers,
  CheckCircle,
  MessageCircle,
  LayoutGrid
} from "lucide-react"

import { useDebounce } from "@/lib/useDebounce"
import { useTheme } from "next-themes"
import { ItemImage } from "@/components/ItemImage"
import { ToastContainer, ToastMessage, ToastType } from "@/components/Toast"
import { FlashSale } from "@/components/FlashSale"
import Image from "next/image"

// --- Types ---

export type Product = {
  id: string
  name: string
  category: string
  subcategory: string | null
  qty: number
  price: number
  originalPrice?: number
  isFlashSale?: boolean
}

export type CartItem = Product & {
  cartQty: number
}

type PriceData = {
  name: string
  category: string
  subcategory?: string
  price: number
  qty?: number
}[]

type SortOption = "price-high" | "price-low" | "name-asc" | "name-desc"

// --- Helpers ---

const getRarityStyle = (price: number): string => {
  if (price >= 1000000) return "shadow-[0_0_25px_rgba(255,165,0,0.4)] border-orange-500 border-2"
  if (price >= 500000) return "shadow-[0_0_15px_rgba(255,165,0,0.2)] border-orange-400 border"
  return "border-slate-200 dark:border-white/10"
}

const priceRanges = [
  { label: "All Prices", min: 0, max: Infinity },
  { label: "Under 50K", min: 0, max: 50000 },
  { label: "50K - 200K", min: 50000, max: 200000 },
  { label: "200K - 500K", min: 200000, max: 500000 },
  { label: "Above 500K", min: 500000, max: Infinity },
]

const formatRupiah = (value: number): string =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value)

// --- Components ---

interface FilterContentProps {
  query: string
  setQuery: (q: string) => void
  selectedSubcategory: string
  setSelectedSubcategory: (sc: string) => void
  uniqueSubcategories: string[]
  sortBy: SortOption
  setSortBy: (s: SortOption) => void
  priceRange: [number, number]
  setPriceRange: (r: [number, number]) => void
}

const FilterContent = (props: FilterContentProps) => {
  const {
    query,
    setQuery,
    selectedSubcategory,
    setSelectedSubcategory,
    uniqueSubcategories,
    sortBy,
    setSortBy,
    priceRange,
    setPriceRange
  } = props;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#151e32] p-5 rounded-xl border border-slate-200 dark:border-white/10 flex items-center gap-4 shadow-sm">
        <div className="w-12 h-12 bg-white p-0.5 rounded-full border border-orange-100 ring-2 ring-orange-500/20 relative overflow-hidden">
          <Image src="/logo-mixy.png" alt="Logo" fill className="rounded-full object-cover" />
        </div>
        <div>
          <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Premium Seller</div>
          <div className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
            Mixy Garage
            <Sparkles size={18} className="text-orange-500" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#151e32] border border-slate-200 dark:border-white/10 p-5 rounded-xl shadow-sm">
        <h3 className="text-slate-800 dark:text-white text-sm font-bold uppercase mb-3 tracking-wider flex items-center gap-2">
          <Search size={14} className="text-orange-500" /> Search
        </h3>
        <div className="relative">
          <Input
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            className="bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-white/10 focus:border-orange-500 dark:focus:border-orange-500 h-11 text-sm rounded-lg"
            placeholder="Search items..."
          />
        </div>
      </div>

      <div className="bg-white dark:bg-[#151e32] border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 flex items-center gap-2">
          <Filter size={16} className="text-orange-500" />
          <span className="text-slate-900 dark:text-white font-bold text-sm">Advanced Filters</span>
        </div>

        <div className="p-5 space-y-6">
          <div>
            <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-2">Series / Collection</label>
            <div className="relative">
              <select
                value={selectedSubcategory}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedSubcategory(e.target.value)}
                className="w-full appearance-none bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-white/10 rounded-lg text-slate-700 dark:text-slate-200 text-sm px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all shadow-inner"
              >
                <option value="all">All Series</option>
                {uniqueSubcategories.map((sc: string) => <option key={sc} value={sc || ""}>{sc}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={14} />
            </div>
          </div>

          <div>
            <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-2">Sort By</label>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value as SortOption)}
                className="w-full appearance-none bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-white/10 rounded-lg text-slate-700 dark:text-slate-200 text-sm px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              >
                <option value="price-high">Price: High to Low</option>
                <option value="price-low">Price: Low to High</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
              </select>
              <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={14} />
            </div>
          </div>

          <div>
            <label className="block text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-3">Price Range</label>
            <div className="space-y-2">
              {priceRanges.map((range, idx: number) => {
                const isSelected = priceRange[0] === range.min && priceRange[1] === range.max;
                return (
                  <div
                    key={idx}
                    onClick={() => setPriceRange([range.min, range.max])}
                    className={`flex items-center gap-3 cursor-pointer p-2 rounded-lg transition-all ${isSelected ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 font-bold border border-orange-200 dark:border-orange-500/20' : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400 border border-transparent'}`}
                  >
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all ${isSelected ? 'border-orange-500 bg-orange-500 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                      {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                    <span className="text-sm">{range.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const MainContent = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [query, setQuery] = useState<string>("")
  const debouncedQuery = useDebounce(query, 300)
  const { theme, setTheme } = useTheme()
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [selectedItem, setSelectedItem] = useState<Product | null>(null)

  const [sortBy, setSortBy] = useState<SortOption>("price-high")
  const [priceRange, setPriceRange] = useState<[number, number]>([0, Infinity])
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const [isCartOpen, setIsCartOpen] = useState<boolean>(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  // Initialize
  useEffect(() => {
    const fetchData = async () => {
      try {
        const priceRes = await fetch("/prices.json");
        const priceData: PriceData = await priceRes.json();

        const merged: Product[] = priceData.map((item) => ({
          id: item.name,
          name: item.name,
          category: item.category,
          subcategory: item.subcategory ?? null,
          qty: item.qty ?? 0,
          price: item.price,
        }));

        setProducts(merged.filter((p: Product) => p.qty > 0));
        setIsLoading(false);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();

    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      const parsed = JSON.parse(savedCart)
      setCart(parsed)
      setSelectedIds(parsed.map((i: CartItem) => i.id))
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart))
    setSelectedIds((prev: string[]) => prev.filter((id: string) => cart.some((item: CartItem) => item.id === id)))
  }, [cart])

  const [currentDate] = useState<string>(new Date().toLocaleDateString('en-CA'))
  const [timeLeft, setTimeLeft] = useState<string>("")

  const flashSaleItems = useMemo((): Product[] => {
    if (products.length === 0) return []
    const seedBase = parseInt(currentDate.replace(/-/g, ''))
    let seed = seedBase;
    const random = () => {
      seed = (1664525 * seed + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    const shuffled = [...products].sort(() => random() - 0.5)
    return shuffled.slice(0, 4).map((item: Product) => ({
      ...item,
      originalPrice: item.price,
      price: Math.floor(item.price * 0.89),
      isFlashSale: true
    }))
  }, [products, currentDate])

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
      const diff = end.getTime() - now.getTime()
      if (diff <= 0) setTimeLeft("00:00:00")
      else {
        const h = Math.floor(diff / 3600000 % 24).toString().padStart(2, '0')
        const m = Math.floor(diff / 60000 % 60).toString().padStart(2, '0')
        const s = Math.floor(diff / 1000 % 60).toString().padStart(2, '0')
        setTimeLeft(`${h}:${m}:${s}`)
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const uniqueSubcategories = useMemo((): string[] => {
    return Array.from(new Set(products
      .filter((p: Product) => selectedCategory === "all" || p.category === selectedCategory)
      .map((p: Product) => p.subcategory)
      .filter((h: string | null): h is string => !!h))).sort()
  }, [products, selectedCategory])

  const filteredAndSorted = useMemo((): Product[] => {
    return products
      .filter((p: Product) =>
        (p.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          p.subcategory?.toLowerCase().includes(debouncedQuery.toLowerCase())) &&
        p.price >= priceRange[0] && p.price <= priceRange[1] &&
        (selectedCategory === "all" || p.category === selectedCategory) &&
        (selectedSubcategory === "all" || p.subcategory === selectedSubcategory)
      )
      .sort((a: Product, b: Product) => {
        if (sortBy === "price-high") return b.price - a.price
        if (sortBy === "price-low") return a.price - b.price
        if (sortBy === "name-asc") return a.name.localeCompare(b.name)
        return b.name.localeCompare(a.name)
      })
  }, [products, debouncedQuery, priceRange, selectedCategory, selectedSubcategory, sortBy])

  const cartCount = cart.reduce((s: number, i: CartItem) => s + i.cartQty, 0)
  const cartTotal = cart.filter((i: CartItem) => selectedIds.includes(i.id)).reduce((s: number, i: CartItem) => {
    const flash = flashSaleItems.find((f: Product) => f.id === i.id)
    return s + (flash ? flash.price : i.price) * i.cartQty
  }, 0)

  const addToast = (message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).substring(7)
    setToasts((prev: ToastMessage[]) => [...prev, { id, message, type }])
  }
  const removeToast = (id: string) => setToasts((prev: ToastMessage[]) => prev.filter((t: ToastMessage) => t.id !== id))

  const addToCart = (product: Product, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const existing = cart.find((i: CartItem) => i.id === product.id)
    if (existing && existing.cartQty >= product.qty) {
      addToast("Max stock reached!", "error")
      return
    }
    setCart((prev: CartItem[]) => existing
      ? prev.map((i: CartItem) => i.id === product.id ? { ...i, cartQty: i.cartQty + 1 } : i)
      : [...prev, { ...product, cartQty: 1 }]
    )
    addToast(`${product.name} added to cart!`)
  }

  const removeFromCart = (ids: string[]) => {
    setCart((prev: CartItem[]) => prev.filter((i: CartItem) => !ids.includes(i.id)))
    addToast("Removed from cart", "info")
  }

  const updateCartQty = (id: string, delta: number) => {
    setCart((prev: CartItem[]) => prev.map((i: CartItem) => {
      if (i.id === id) {
        const n = Math.max(1, Math.min(i.qty, i.cartQty + delta))
        return { ...i, cartQty: n }
      }
      return i
    }))
  }

  const checkoutWhatsApp = () => {
    const selectedItems = cart.filter((i: CartItem) => selectedIds.includes(i.id))
    const list = selectedItems.map((i: CartItem) => {
      const flash = flashSaleItems.find((f: Product) => f.id === i.id)
      const p = flash ? flash.price : i.price
      return `${i.cartQty}x ${i.name} (${formatRupiah(p)})`
    }).join('\n')
    const msg = `Halo Mixy Garage! Saya ingin memesan:\n\n${list}\n\nTotal: ${formatRupiah(cartTotal)}`
    window.open(`https://wa.me/6281234567890?text=${encodeURIComponent(msg)}`, "_blank")
  }

  const handleCardClick = (p: Product) => {
    setSelectedItem(p)
    setIsModalOpen(true)
  }

  const handleBuyNow = (p: Product) => {
    const flash = flashSaleItems.find((f: Product) => f.id === p.id)
    const price = flash ? flash.price : p.price
    const msg = `Halo Mixy Garage! Saya ingin membeli: 1x ${p.name} (${formatRupiah(price)})`
    window.open(`https://wa.me/6281234567890?text=${encodeURIComponent(msg)}`, "_blank")
  }

  const [mounted, setMounted] = useState<boolean>(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#151e32]/95 backdrop-blur-md border-b border-slate-200 dark:border-white/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => (window.location.href = '/')}>
            <div className="relative w-10 h-10 rounded-lg overflow-hidden shadow-lg border border-slate-200 dark:border-white/10">
              <Image src="/logo-mixy.png" alt="Mixy Garage" fill className="object-cover" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter uppercase leading-none">Mixy <span className="text-orange-500">Garage</span></h1>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">Diecast & Card Collectibles</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="p-2 rounded-lg bg-slate-100 dark:bg-white/10 text-orange-500">
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => setIsCartOpen(true)} className="relative p-2 rounded-lg bg-slate-100 dark:bg-white/10">
              <ShoppingBag size={20} />
              {cartCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-600 text-white text-[10px] font-black flex items-center justify-center rounded-full">{cartCount}</span>}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <FlashSale products={products} flashSaleItems={flashSaleItems} timeLeft={timeLeft} onCardClick={handleCardClick} onAddToCart={addToCart} onBuyNow={handleBuyNow} />

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="hidden lg:block w-72 flex-shrink-0 space-y-6">
            <FilterContent query={query} setQuery={setQuery} selectedSubcategory={selectedSubcategory} setSelectedSubcategory={setSelectedSubcategory} uniqueSubcategories={uniqueSubcategories} sortBy={sortBy} setSortBy={setSortBy} priceRange={priceRange} setPriceRange={setPriceRange} />
          </aside>

          <div className="flex-1 space-y-6">
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "all", label: "All", icon: <LayoutGrid /> },
                { id: "Diecast", label: "Cars", icon: <Car /> },
                { id: "Pokemon", label: "Cards", icon: <Layers /> }
              ].map((c) => (
                <button key={c.id} onClick={() => { setSelectedCategory(c.id); setSelectedSubcategory("all"); }} className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${selectedCategory === c.id ? "bg-orange-500 text-white border-orange-600 shadow-lg" : "bg-white dark:bg-[#151e32] border-slate-200 dark:border-white/10 hover:border-orange-500/50"}`}>
                  {c.icon}<span className="text-[10px] font-black uppercase mt-2">{c.label}</span>
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i: number) => <div key={i} className="aspect-[3/4] bg-white dark:bg-[#151e32] rounded-2xl animate-pulse" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSorted.map((p: Product, i: number) => (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} onClick={() => handleCardClick(p)} className={`group bg-white dark:bg-[#151e32] rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden cursor-pointer hover:-translate-y-1 transition-all ${getRarityStyle(p.price)}`}>
                    <div className="relative aspect-square bg-slate-50 dark:bg-[#0B1120] p-4 flex items-center justify-center">
                      <ItemImage itemName={p.name} className="w-full h-full object-contain" />
                      {p.qty < 3 && <span className="absolute top-2 right-2 px-2 py-0.5 bg-red-500 text-white text-[8px] font-black rounded-full">LOW STOCK</span>}
                    </div>
                    <div className="p-4">
                      <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">{p.subcategory}</span>
                      <h3 className="font-bold text-sm line-clamp-1 mb-2 text-slate-900 dark:text-white">{p.name}</h3>
                      <div className="flex items-center justify-between">
                        <span className="font-black text-orange-600 dark:text-orange-500">{formatRupiah(p.price).replace(",00", "")}</span>
                        <button onClick={(e: React.MouseEvent) => { e.stopPropagation(); addToCart(p); }} className="p-2 bg-slate-100 dark:bg-white/10 rounded-lg text-slate-400 hover:text-orange-500 transition-colors"><ShoppingBag size={16} /></button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <AnimatePresence>
        {isModalOpen && selectedItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-[#151e32] rounded-3xl p-6 w-full max-w-xl relative shadow-2xl" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-white/10 rounded-full"><X size={20} /></button>
              <div className="flex gap-6 mb-8">
                <div className="w-32 h-32 bg-slate-50 dark:bg-black/20 rounded-2xl p-4 flex items-center justify-center"><ItemImage itemName={selectedItem.name} /></div>
                <div>
                  <span className="text-xs font-bold text-orange-500 uppercase">{selectedItem.category}</span>
                  <h3 className="text-2xl font-black leading-tight mb-2 text-slate-900 dark:text-white">{selectedItem.name}</h3>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-slate-100 dark:bg-white/10 rounded-full text-[10px] font-bold text-slate-600 dark:text-slate-300">{selectedItem.subcategory}</span>
                    <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-[10px] font-bold">{selectedItem.qty} IN STOCK</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-50 dark:bg-[#0B1120] p-4 rounded-2xl"><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Price</p><p className="text-2xl font-black text-orange-500">{formatRupiah(selectedItem.price)}</p></div>
                <div className="bg-slate-50 dark:bg-[#0B1120] p-4 rounded-2xl"><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status</p><p className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white"><CheckCircle size={16} className="text-green-500" /> Authenticated</p></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleBuyNow(selectedItem)} className="py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black shadow-lg shadow-orange-500/20 transition-all">BUY NOW</button>
                <button onClick={() => addToCart(selectedItem)} className="py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black hover:opacity-90 transition-all">ADD TO CART</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCartOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 flex justify-end" onClick={() => setIsCartOpen(false)}>
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} onClick={(e: React.MouseEvent) => e.stopPropagation()} className="w-full max-w-md bg-white dark:bg-[#151e32] h-full shadow-2xl flex flex-col p-6">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black flex items-center gap-2 text-slate-900 dark:text-white"><ShoppingBag className="text-orange-500" /> My Cart <span className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full">{cartCount}</span></h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {cart.length === 0 ? <p className="text-center text-slate-400 mt-20">Your cart is empty</p> : cart.map((i: CartItem) => (
                  <div key={i.id} className="flex gap-4 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 group">
                    <input type="checkbox" checked={selectedIds.includes(i.id)} onChange={() => setSelectedIds((prev: string[]) => prev.includes(i.id) ? prev.filter((x: string) => x !== i.id) : [...prev, i.id])} className="accent-orange-500 w-4 h-4 rounded" />
                    <div className="w-16 h-16 bg-white dark:bg-black/20 rounded-lg p-1 flex-shrink-0"><ItemImage itemName={i.name} /></div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="flex justify-between items-start"><h4 className="font-bold text-xs truncate text-slate-900 dark:text-white">{i.name}</h4><button onClick={() => removeFromCart([i.id])} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button></div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-black text-sm text-orange-500">{formatRupiah(i.price)}</span>
                        <div className="flex items-center gap-2 bg-white dark:bg-white/10 rounded-lg p-1 border border-slate-200 dark:border-white/5">
                          <button onClick={() => updateCartQty(i.id, -1)} className="w-5 h-5 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10 rounded transition-colors">-</button>
                          <span className="text-xs font-bold w-6 text-center">{i.cartQty}</span>
                          <button onClick={() => updateCartQty(i.id, 1)} className="w-5 h-5 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10 rounded transition-colors">+</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {cart.length > 0 && (
                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/10 space-y-4">
                  <div className="flex justify-between items-center"><span className="text-slate-500 font-bold uppercase text-xs tracking-widest">Subtotal</span><span className="text-2xl font-black text-slate-900 dark:text-white">{formatRupiah(cartTotal)}</span></div>
                  <button onClick={checkoutWhatsApp} className="w-full py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 transition-all active:scale-[0.98] uppercase tracking-wider"><MessageCircle size={20} /> Checkout via WhatsApp</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div></div>}>
      <MainContent />
    </Suspense>
  )
}
