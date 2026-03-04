"use client"

import React, { useEffect, useState, useMemo, Suspense, useRef } from "react"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, animate } from "framer-motion"
import {
  Search,
  ShoppingBag,
  X,
  Trash2,
  ChevronDown,
  Sun,
  Moon,
  Sparkles,
  CheckCircle,
  LayoutGrid,
  Zap,
} from "lucide-react"

import { useDebounce } from "@/lib/useDebounce"
import { useTheme } from "next-themes"
import { ItemImage } from "@/components/ItemImage"
import { ToastContainer, ToastMessage, ToastType } from "@/components/Toast"
import { GradingService } from "@/components/GradingService"
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
  condition?: string
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

type AppView = "inventory" | "grading"

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

const EnergyIcons: Record<string, React.ReactNode> = {
  "Base Set": <LayoutGrid size={18} />,
  "Fresh Pull": <Sparkles size={18} className="text-vault-gold" />,
  "PSA 10": <CheckCircle size={18} className="text-vault-cyan" />,
  "PSA 9": <CheckCircle size={18} className="text-slate-400" />,
  "BGS 10 Black Label": <CheckCircle size={18} className="text-black dark:text-white" />,
  "CGC 10 Pristine": <CheckCircle size={18} className="text-vault-cyan" />,
  "Pokemon": <Zap size={18} />,
};

const energyTypes = [
  { id: "all", label: "All Collections", icon: <LayoutGrid size={18} />, view: "inventory" },
  { id: "Pokemon", label: "Pokemon TCG", icon: <Zap size={18} />, view: "inventory" },
];

const ThreeDCardShowcase = ({ featuredCards }: { featuredCards: Product[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [displayCard, setDisplayCard] = useState(featuredCards[0])
  const [isHovering, setIsHovering] = useState(false)
  const isHoveringRef = useRef(false)
  const currentIndexRef = useRef(0)

  // Mouse tilt values
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 150, damping: 20 })
  const springY = useSpring(mouseY, { stiffness: 150, damping: 20 })
  const rotateX = useTransform(springY, [-0.5, 0.5], [15, -15])
  const rotateY = useTransform(springX, [-0.5, 0.5], [-15, 15])
  const holoX = useTransform(springX, [-0.5, 0.5], ["0%", "100%"])
  const holoY = useTransform(springY, [-0.5, 0.5], ["0%", "100%"])

  // Card rotation angle - drives the continuous spin
  const cardRotation = useMotionValue(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    mouseX.set(x)
    mouseY.set(y)
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
    isHoveringRef.current = false
    mouseX.set(0)
    mouseY.set(0)
  }

  const handleMouseEnter = () => {
    setIsHovering(true)
    isHoveringRef.current = true
  }

  // Core spin loop
  useEffect(() => {
    if (featuredCards.length <= 1) return

    let stopped = false

    const PAUSE_ON_FRONT_MS = 3000  // how long each card is shown
    const FLIP_HALF_MS = 500        // duration of each half-flip (front→back, back→front)

    const waitIfHovering = () => new Promise<void>(res => {
      if (!isHoveringRef.current) { res(); return }
      const check = () => {
        if (!isHoveringRef.current || stopped) { res(); return }
        requestAnimationFrame(check)
      }
      requestAnimationFrame(check)
    })

    const spinLoop = async () => {
      while (!stopped) {
        // 1. PAUSE — show current card front, but bail out if hovering
        await waitIfHovering()
        if (stopped) break

        // Wait the display time, but abort early if hovering starts
        const waitFront = (): Promise<void> => new Promise(res => {
          let elapsed = 0
          const start = Date.now()
          const tick = () => {
            if (stopped) { res(); return }
            if (isHoveringRef.current) { res(); return } // cut short on hover
            elapsed = Date.now() - start
            if (elapsed >= PAUSE_ON_FRONT_MS) { res(); return }
            requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        })
        await waitFront()
        if (stopped) break

        // If hover happened during pause, go back to waiting
        if (isHoveringRef.current) { await waitIfHovering(); if (stopped) break }

        // 2. FLIP FIRST HALF — front → back (quarter-turn ease-in)
        const cur = cardRotation.get()
        await animate(cardRotation, cur + 180, {
          duration: FLIP_HALF_MS / 1000,
          ease: "easeIn"
        })
        if (stopped) break

        // 3. SWAP CARD — now back is visible, swap to next card immediately
        const nextIndex = (currentIndexRef.current + 1) % featuredCards.length
        currentIndexRef.current = nextIndex
        setCurrentIndex(nextIndex)
        setDisplayCard(featuredCards[nextIndex])

        // 4. FLIP SECOND HALF — back → front of new card (ease-out)
        await animate(cardRotation, cur + 360, {
          duration: FLIP_HALF_MS / 1000,
          ease: "easeOut"
        })
        // Loop back → PAUSE again on new card
      }
    }

    spinLoop()
    return () => { stopped = true }
  }, [featuredCards])

  if (!displayCard) return null

  const holoIntensity = Math.min(0.6, (displayCard.price / 5000000) * 0.4 + 0.1)

  return (
    <section className="py-8 sm:py-20 flex flex-col lg:flex-row items-center justify-between gap-8 sm:gap-20 overflow-hidden bg-slate-50 dark:bg-black/40 rounded-[2rem] sm:rounded-[4rem] border-2 border-slate-100 dark:border-white/5 mb-12 sm:mb-16 relative shadow-2xl px-6 sm:px-16 lg:px-24">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-1/2 left-0 w-[800px] h-[800px] bg-vault-accent/30 blur-[150px] rounded-full -translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="relative z-10 w-full lg:w-1/2 text-left space-y-8 order-2 lg:order-1">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-12 h-1 bg-vault-accent/30 rounded-full" />
            <span className="px-3 py-1 bg-vault-accent/10 border border-vault-accent/20 text-vault-accent text-[9px] font-black uppercase tracking-widest rounded">ELITE VAULT ITEM</span>
          </div>
          <h2 className="text-2xl sm:text-5xl font-black italic text-slate-900 dark:text-white uppercase tracking-tighter leading-[0.9] line-clamp-2">
            {displayCard.name}
          </h2>
          <p className="text-[10px] font-black text-slate-400 dark:text-vault-accent uppercase tracking-[0.6em]">Currently High-Value Artifact Inspection</p>
        </div>

        <div className="p-8 bg-white dark:bg-vault-charcoal rounded-3xl border border-slate-200 dark:border-white/5 inline-block shadow-2xl">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 font-mono">Authenticated Market Value</p>
          <span className="text-3xl sm:text-6xl font-black text-vault-accent italic tracking-tighter leading-none">{formatRupiah(displayCard.price)}</span>
        </div>
      </div>

      <div
        className="relative w-56 h-[340px] sm:w-80 sm:h-[450px] order-1 lg:order-2 shrink-0 cursor-pointer"
        style={{ perspective: "1200px" }}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Outer: continuous spin */}
        <motion.div
          style={{
            rotateY: cardRotation,
            transformStyle: "preserve-3d",
            width: "100%",
            height: "100%",
            position: "relative"
          }}
        >
          {/* Inner: mouse tilt (only on front face angle) */}
          <motion.div
            style={{
              rotateX: isHovering ? rotateX : 0,
              rotateY: isHovering ? rotateY : 0,
              transformStyle: "preserve-3d",
              width: "100%",
              height: "100%"
            }}
          >
            {/* Front face */}
            <div
              className="absolute inset-0 rounded-[1.5rem] overflow-hidden border border-slate-200/30 dark:border-white/5 shadow-2xl vault-holo bg-white dark:bg-black flex items-center justify-center"
              style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" } as React.CSSProperties}
            >
              <ItemImage itemName={displayCard.name} className="w-full h-full object-cover" />
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(110deg, transparent 40%, rgba(255,255,255,0.4) 45%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.4) 55%, transparent 60%)",
                  backgroundSize: "200% 200%",
                  mixBlendMode: "overlay",
                  backgroundPositionX: holoX,
                  backgroundPositionY: holoY,
                  opacity: holoIntensity
                }}
              />
            </div>

            {/* Back face — visible at 180° */}
            <div
              className="absolute inset-0 rounded-[1.5rem] overflow-hidden border border-slate-200/30 dark:border-white/5 shadow-2xl bg-[#1a2b4b]"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg)"
              } as React.CSSProperties}
            >
              <img src="/items/card_back.png" alt="Card Back" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-vault-accent/10 mix-blend-overlay" />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

const MainContent = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [view, setView] = useState<AppView>("inventory")
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
          condition: (item as any).condition || "Mint"
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

  const uniqueSubcategories = useMemo((): string[] => {
    return Array.from(new Set(products
      .filter((p: Product) => {
        if (selectedCategory === "all") return true
        return p.category === selectedCategory
      })
      .map((p: Product) => p.subcategory)
      .filter((h: string | null): h is string => !!h))).sort()
  }, [products, selectedCategory])

  const featuredCards = useMemo((): Product[] => {
    return [...products]
      .sort((a, b) => b.price - a.price)
      .slice(0, 5)
  }, [products])

  const filteredAndSorted = useMemo((): Product[] => {
    return products
      .filter((p: Product) => {
        const matchesQuery = p.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          p.subcategory?.toLowerCase().includes(debouncedQuery.toLowerCase())
        const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1]

        let matchesCategory = true
        if (selectedCategory !== "all") {
          matchesCategory = p.category === selectedCategory
        }

        const matchesSubcategory = selectedSubcategory === "all" || p.subcategory === selectedSubcategory

        return matchesQuery && matchesPrice && matchesCategory && matchesSubcategory
      })
      .sort((a: Product, b: Product) => {
        if (sortBy === "price-high") return b.price - a.price
        if (sortBy === "price-low") return a.price - b.price
        if (sortBy === "name-asc") return a.name.localeCompare(b.name)
        return b.name.localeCompare(a.name)
      })
  }, [products, debouncedQuery, priceRange, selectedCategory, selectedSubcategory, sortBy])

  const cartCount = cart.reduce((s: number, i: CartItem) => s + i.cartQty, 0)

  const cartTotal = cart.filter((i: CartItem) => selectedIds.includes(i.id)).reduce((s: number, i: CartItem) => {
    return s + i.price * i.cartQty
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
    const list = selectedItems.map((i: CartItem) => `${i.cartQty}x ${i.name} (${formatRupiah(i.price)})`).join('\n')
    const msg = `Halo Mixy Garage! Saya ingin memesan:\n\n${list}\n\nTotal: ${formatRupiah(cartTotal)}`
    window.open(`https://wa.me/6281234567890?text=${encodeURIComponent(msg)}`, "_blank")
  }

  const handleCardClick = (p: Product) => {
    setSelectedItem(p)
    setIsModalOpen(true)
  }

  const handleBuyNow = (p: Product) => {
    const msg = `Halo Mixy Garage! Saya ingin membeli: 1x ${p.name} (${formatRupiah(p.price)})`
    window.open(`https://wa.me/6281234567890?text=${encodeURIComponent(msg)}`, "_blank")
  }

  const [mounted, setMounted] = useState<boolean>(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300">
      {/* Premium Vault Header */}
      <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-vault-black/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-24 flex items-center justify-between gap-6">
          {/* Left Side: Logo & Primary Nav */}
          <div className="flex items-center gap-8 shrink-0">
            <div className="flex items-center gap-4 cursor-pointer group shrink-0" onClick={() => (window.location.href = '/')}>
              <div className="relative w-12 h-12 sm:w-16 sm:h-16 bg-white p-1.5 rounded-2xl border-2 border-vault-accent shadow-lg group-hover:scale-105 transition-all">
                <Image src="/logo-mixy.png" alt="Mixy Garage" fill className="object-cover rounded-xl" />
              </div>
              <div className="hidden lg:block shrink-0">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">MIXY <span className="text-vault-accent">GARAGE</span></h1>
                <p className="text-[10px] font-black text-slate-400 dark:text-vault-accent/60 uppercase tracking-[0.4em] mt-1">Pokemon Elite Vault</p>
              </div>
            </div>

            {/* Primary Navigation (Desktop) */}
            <nav className="hidden lg:flex items-center gap-10 px-10 border-l border-slate-200 dark:border-white/10 shrink-0 h-12">
              <button
                onClick={() => { setView("inventory"); setSelectedCategory("all"); }}
                className={`text-[11px] font-black uppercase tracking-[0.4em] transition-all relative py-2 ${view === "inventory" ? "text-vault-accent" : "text-slate-400 hover:text-foreground"}`}
              >
                The Vault
                {view === "inventory" && <motion.div layoutId="nav-underline" className="absolute -bottom-1 left-0 right-0 h-0.5 bg-vault-accent" />}
              </button>
              <button
                onClick={() => { setView("grading"); setSelectedCategory("all"); }}
                className={`text-[11px] font-black uppercase tracking-[0.4em] transition-all relative py-2 ${view === "grading" ? "text-vault-accent" : "text-slate-400 hover:text-foreground"}`}
              >
                Grading
                {view === "grading" && <motion.div layoutId="nav-underline" className="absolute -bottom-1 left-0 right-0 h-0.5 bg-vault-accent" />}
              </button>
            </nav>
          </div>

          {/* Right Side: Search, Mobile Nav, Icons */}
          <div className="flex items-center justify-end flex-1 gap-2 sm:gap-4">
            {/* Mobile Navigation */}
            <div className="flex lg:hidden items-center gap-2 pr-2 sm:pr-4 border-r border-slate-200 dark:border-white/10 shrink-0">
              <button
                onClick={() => { setView("inventory"); setSelectedCategory("all"); }}
                className={`p-2.5 rounded-xl transition-all ${view === "inventory" ? "bg-vault-accent text-white shadow-lg shadow-vault-accent/20" : "text-slate-400 hover:text-vault-accent"}`}
                title="The Vault"
              >
                <LayoutGrid size={20} />
              </button>
              <button
                onClick={() => { setView("grading"); setSelectedCategory("all"); }}
                className={`p-2.5 rounded-xl transition-all ${view === "grading" ? "bg-vault-accent text-white shadow-lg shadow-vault-accent/20" : "text-slate-400 hover:text-vault-accent"}`}
                title="Grading"
              >
                <Sparkles size={20} />
              </button>
            </div>

            <AnimatePresence>
              {view === "inventory" && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex-1 max-w-xl relative group overflow-hidden"
                >
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-vault-accent transition-colors">
                    <Search size={20} />
                  </div>
                  <Input
                    value={query}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-vault-charcoal border-2 border-transparent focus:border-vault-accent h-12 rounded-2xl pl-14 pr-6 text-foreground placeholder:text-slate-400 text-sm font-bold transition-all shadow-inner focus:outline-none"
                    placeholder="Scan inventory records..."
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-3 rounded-2xl bg-slate-100 dark:bg-vault-charcoal border-2 border-transparent hover:border-vault-accent transition-all text-foreground"
              >
                {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-3 rounded-2xl bg-vault-accent text-white shadow-xl hover:translate-y-[-2px] transition-all"
              >
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-7 h-7 bg-white text-vault-accent text-[12px] font-black flex items-center justify-center rounded-full border-4 border-vault-accent shadow-lg">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Energy Navigation Bar */}
      <AnimatePresence>
        {view === "inventory" && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="sticky top-16 sm:top-24 z-40 bg-white dark:bg-vault-black border-b border-slate-200 dark:border-white/10 shadow-sm overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 h-14 sm:h-16 flex items-center gap-3 sm:gap-6 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-2 sm:gap-3 pr-4 sm:pr-6 border-r border-slate-200 dark:border-white/10 shrink-0">
                <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Archives:</span>
              </div>
              <div className="flex items-center gap-3 sm:gap-4">
                {energyTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => {
                      setSelectedCategory(type.id);
                      setSelectedSubcategory("all");
                      setView(type.view as AppView);
                    }}
                    className={`flex items-center gap-2 px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border-2 transition-all whitespace-nowrap text-[9px] sm:text-[11px] font-black uppercase tracking-widest ${selectedCategory === type.id ? "bg-vault-accent border-vault-accent text-white shadow-lg" : "bg-transparent border-slate-200 dark:border-white/5 text-slate-400 hover:border-vault-accent/30"}`}
                  >
                    {type.icon}
                    {type.label}
                  </button>
                ))}
              </div>

              <div className="w-px h-6 bg-slate-200 dark:bg-white/10 shrink-0 mx-2" />
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedSubcategory("all")}
                  className={`flex items-center gap-2 px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border-2 transition-all whitespace-nowrap text-[9px] sm:text-[11px] font-black uppercase tracking-widest ${selectedSubcategory === "all" ? "bg-slate-900 dark:bg-white border-transparent text-white dark:text-black shadow-lg" : "bg-transparent border-slate-200 dark:border-white/5 text-slate-400"}`}
                >
                  All Grades
                </button>
                {uniqueSubcategories.map((sc) => (
                  <button
                    key={sc}
                    onClick={() => setSelectedSubcategory(sc)}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl border-2 transition-all whitespace-nowrap text-[11px] font-black uppercase tracking-widest ${selectedSubcategory === sc ? "bg-vault-cyan border-vault-cyan text-black shadow-lg" : "bg-transparent border-slate-200 dark:border-white/5 text-slate-500 hover:border-vault-cyan/30"}`}
                  >
                    {EnergyIcons[sc] || <Sparkles size={14} />}
                    {sc}
                  </button>
                ))}
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-16 pt-24 sm:pt-32">
        <AnimatePresence mode="wait">
          {view === "grading" ? (
            <motion.div
              key="grading"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <GradingService />
            </motion.div>
          ) : (
            <motion.div
              key="inventory"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-16"
            >
              {featuredCards.length > 0 && <ThreeDCardShowcase featuredCards={featuredCards} />}
              {/* Elite Hero Section */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative h-[220px] sm:h-[400px] rounded-[2rem] sm:rounded-[3rem] overflow-hidden group shadow-2xl"
              >
                <div className="absolute inset-0 bg-vault-charcoal">
                  <div className="absolute inset-0 opacity-40 mix-blend-overlay">
                    {/* Visual Texture / Background */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-vault-accent/20 via-transparent to-vault-cyan/10" />
                  </div>
                </div>

                <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mb-6 px-6 py-2 bg-vault-accent/10 border border-vault-accent/20 rounded-full text-vault-accent text-[10px] font-black uppercase tracking-[0.5em] backdrop-blur-md"
                  >
                    Now Accessing Elite Archives
                  </motion.div>

                  <h1 className="text-4xl sm:text-8xl font-black italic text-white uppercase leading-[0.8] tracking-tighter mb-6 sm:mb-8 drop-shadow-2xl">
                    The Pinnacle of <br />
                    <span className="text-vault-gradient">Collectibles</span>
                  </h1>

                  <p className="max-w-2xl text-slate-400 text-xs sm:text-lg font-medium leading-relaxed mb-8 sm:mb-10 tracking-wide px-4">
                    Where museum-grade Pokemon artifacts meet the next generation of authentication. <br className="hidden sm:block" />
                    Discover pieces that define legacies.
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-6">
                    <button className="px-10 py-5 bg-vault-accent text-white font-black rounded-2xl shadow-xl hover:translate-y-[-4px] active:scale-95 transition-all uppercase tracking-widest text-xs border-b-4 border-vault-accent/50">
                      Explore Archives
                    </button>
                    <div className="flex items-center gap-4 text-slate-500 font-black text-[10px] uppercase tracking-[0.3em]">
                      <span className="w-12 h-px bg-white/10" />
                      Secured by Mixy Vault
                      <span className="w-12 h-px bg-white/10" />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Main Vault Inventory Section */}
              <div className="space-y-12">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 px-2">
                  <div className="flex items-center gap-6">
                    <div className="p-5 rounded-[2rem] bg-vault-accent/10 text-vault-accent border border-vault-accent/20 backdrop-blur-sm shadow-xl">
                      <LayoutGrid size={40} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="w-12 h-0.5 bg-vault-accent/40" />
                        <h2 className="text-sm font-black text-slate-400 dark:text-vault-gold uppercase tracking-[0.6em]">Vault Records</h2>
                      </div>
                      <h3 className="text-2xl sm:text-5xl font-black italic text-slate-900 dark:text-white uppercase tracking-tighter leading-none">
                        MIXY <span className="text-vault-accent">INVENTORY</span>
                      </h3>
                      <p className="text-[10px] font-black text-slate-400 dark:text-vault-accent uppercase tracking-[0.4em] mt-3">
                        {filteredAndSorted.length} artifacts identified in current filter
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative group">
                      <select
                        value={sortBy}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value as SortOption)}
                        className="appearance-none bg-slate-100 dark:bg-vault-charcoal border-2 border-slate-200 dark:border-white/10 rounded-2xl px-8 py-4 text-xs font-black uppercase tracking-widest focus:outline-none focus:border-vault-accent transition-all cursor-pointer pr-14 shadow-sm"
                      >
                        <option value="price-high">Value: High-Low</option>
                        <option value="price-low">Value: Low-High</option>
                        <option value="name-asc">Name: A-Z</option>
                      </select>
                      <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-vault-accent pointer-events-none" size={20} />
                    </div>
                  </div>
                </div>

                {isLoading ? (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-10">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i: number) => (
                      <div key={i} className="aspect-[3/4] bg-slate-200 dark:bg-zinc-800 rounded-[2.5rem] animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-10">
                    {filteredAndSorted.map((p: Product, i: number) => (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: (i % 8) * 0.05 }}
                        onClick={() => handleCardClick(p)}
                        className="group tcg-slab bg-white dark:bg-vault-charcoal rounded-[1.5rem] sm:rounded-[2rem] p-3 sm:p-4 border-2 border-slate-100 dark:border-white/5 hover:border-vault-accent/30 cursor-pointer"
                      >
                        <div className="relative aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden mb-3 sm:mb-6 bg-slate-50 dark:bg-black/40 vault-screen flex items-center justify-center p-4 sm:p-6 group-hover:scale-[1.02] transition-transform duration-500 vault-holo">
                          <ItemImage itemName={p.name} className="scale-100 group-hover:scale-110 blur-0" />
                          {p.qty < 3 && (
                            <div className="absolute top-4 left-4 px-3 py-1 bg-vault-accent text-white text-[9px] font-black rounded-lg shadow-lg">
                              LOW STOCK
                            </div>
                          )}
                        </div>

                        <div className="px-1 flex-1 flex flex-col">
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-4">
                            <span className={`w-3 h-3 rounded-md shadow-sm ${p.category === 'Pokemon' ? 'bg-vault-accent' : 'bg-vault-cyan'}`} />
                            <span className="text-[8px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{p.subcategory}</span>
                            {p.condition && (
                              <span className="ml-auto px-2 py-0.5 bg-vault-gold/10 text-vault-gold text-[9px] font-black rounded border border-vault-gold/20 uppercase">
                                {p.condition}
                              </span>
                            )}
                          </div>
                          <h3 className="font-black text-[11px] sm:text-sm mb-3 sm:mb-6 text-slate-900 dark:text-zinc-100 uppercase italic line-clamp-2 leading-tight group-hover:text-vault-accent transition-colors">{p.name}</h3>

                          <div className="mt-auto pt-4 sm:pt-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
                            <div>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">Vault Value</p>
                              <span className="font-black text-lg sm:text-2xl text-vault-accent italic tracking-tighter leading-none">{formatRupiah(p.price).replace(",00", "")}</span>
                            </div>
                            <button
                              onClick={(e: React.MouseEvent) => { e.stopPropagation(); addToCart(p); }}
                              className="w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center bg-slate-900 dark:bg-vault-accent text-white rounded-xl sm:rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-xl shrink-0"
                            >
                              <ShoppingBag size={22} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {filteredAndSorted.length === 0 && (
                  <div className="py-20 text-center">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                      <Search size={40} />
                    </div>
                    <h3 className="text-2xl font-black uppercase italic text-slate-400">No Data Encounters</h3>
                    <p className="text-slate-500 mt-2 font-bold uppercase text-[10px] tracking-widest">Adjust your filters to scan more items</p>
                    <button
                      onClick={() => { setQuery(""); setSelectedCategory("all"); setSelectedSubcategory("all"); }}
                      className="mt-8 px-10 py-4 bg-vault-charcoal border-2 border-vault-accent text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-vault-accent hover:scale-105 transition-all"
                    >
                      Reset All Scanners
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Vault Collection Drawer (Cart) */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md"
              onClick={() => setIsCartOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 200 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="fixed top-0 right-0 w-full max-w-lg h-full z-[70] bg-white dark:bg-vault-black shadow-2xl flex flex-col border-l-8 border-vault-accent vault-frame"
            >
              <div className="px-10 pt-12 pb-8 border-b-2 border-slate-200 dark:border-white/10 flex items-center justify-between">
                <div>
                  <h2 className="text-4xl font-black italic text-slate-900 dark:text-white leading-none">
                    VAULT <span className="text-vault-accent">DECK</span>
                  </h2>
                  <p className="text-[10px] font-black text-slate-400 dark:text-vault-cyan uppercase tracking-[0.4em] mt-3">Selection Authenticator</p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="w-16 h-16 flex items-center justify-center bg-slate-100 dark:bg-vault-charcoal rounded-2xl hover:bg-vault-accent hover:text-white transition-all shadow-sm"
                >
                  <X size={32} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-10">
                    <ShoppingBag size={120} className="mb-6" />
                    <p className="font-black text-3xl uppercase italic tracking-tighter">Deck Empty</p>
                  </div>
                ) : (
                  cart.map((i: CartItem) => (
                    <motion.div
                      layout
                      key={i.id}
                      className="flex gap-5 p-6 bg-slate-50 dark:bg-vault-charcoal rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm group hover:border-vault-accent/30 transition-all"
                    >
                      <div className="w-24 h-24 bg-white dark:bg-black rounded-3xl overflow-hidden shrink-0 vault-screen flex items-center justify-center p-2 border border-slate-200 dark:border-white/10 group-hover:border-vault-accent/20 transition-all">
                        <ItemImage itemName={i.name} />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                        <div className="flex justify-between items-start gap-4">
                          <h4 className="font-black text-xs text-slate-900 dark:text-white uppercase italic tracking-tight line-clamp-2">{i.name}</h4>
                          <button onClick={() => removeFromCart([i.id])} className="p-2 text-slate-300 hover:text-vault-accent transition-colors">
                            <Trash2 size={20} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-black text-xl text-vault-accent italic">{formatRupiah(i.price).replace(",00", "")}</span>
                          <div className="flex items-center gap-3 bg-white dark:bg-black rounded-xl p-1 shadow-inner border border-slate-200 dark:border-white/10">
                            <button onClick={() => updateCartQty(i.id, -1)} className="w-8 h-8 flex items-center justify-center hover:bg-vault-accent hover:text-white rounded-lg transition-all font-black">-</button>
                            <span className="text-xs font-black w-6 text-center">{i.cartQty}</span>
                            <button onClick={() => updateCartQty(i.id, 1)} className="w-8 h-8 flex items-center justify-center hover:bg-vault-accent hover:text-white rounded-lg transition-all font-black">+</button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                  ))}
              </div>

              {cart.length > 0 && (
                <div className="p-10 bg-white dark:bg-vault-black border-t-2 border-slate-200 dark:border-white/10 space-y-8">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-slate-400 dark:text-vault-cyan uppercase tracking-[0.4em]">Vault Total Valuation</span>
                    <span className="text-4xl font-black text-slate-900 dark:text-white italic tracking-tighter">{formatRupiah(cartTotal)}</span>
                  </div>
                  <button
                    onClick={checkoutWhatsApp}
                    className="w-full py-7 bg-vault-accent text-white font-black rounded-2xl flex items-center justify-center gap-4 shadow-2xl hover:translate-y-[-4px] transition-all active:scale-95 uppercase tracking-widest text-sm border-2 border-white/20"
                  >
                    PROCEED TO CHANNEL <ShoppingBag size={24} />
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Legendary Inspection Modal */}
      <AnimatePresence>
        {isModalOpen && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: "spring", duration: 0.6 }}
              className="bg-white dark:bg-vault-black rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden w-full max-w-5xl relative shadow-2xl border-2 border-vault-accent/30 flex flex-col md:flex-row"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-8 right-8 p-4 bg-vault-accent text-white rounded-2xl shadow-xl hover:rotate-90 transition-transform z-[110]"
              >
                <X size={32} />
              </button>

              <div className="flex flex-col md:flex-row h-full">
                <div className="w-full md:w-1/2 bg-slate-100 dark:bg-black flex items-center justify-center p-16 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-vault-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative w-full aspect-[3/4] group-hover:scale-105 transition-transform duration-700 vault-holo max-w-xs md:max-w-none">
                    <ItemImage itemName={selectedItem.name} className="scale-100" />
                  </div>
                  {/* Digital Signature Decor */}
                  <div className="absolute bottom-6 left-10 right-10 flex justify-between items-center">
                    <div className="h-0.5 bg-vault-accent/30 flex-1" />
                    <span className="px-6 text-[9px] font-black text-vault-accent uppercase tracking-[0.6em] whitespace-nowrap">SECURE VAULT AUTHENTIC</span>
                    <div className="h-0.5 bg-vault-accent/30 flex-1" />
                  </div>
                </div>

                <div className="flex-1 p-8 sm:p-12 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-8">
                      <div className="px-4 py-1.5 bg-vault-accent text-white text-[11px] font-black uppercase tracking-widest rounded-lg">COLLECTIBLE</div>
                      <div className="px-4 py-1.5 bg-vault-cyan text-black text-[11px] font-black uppercase tracking-widest rounded-lg">{selectedItem.subcategory}</div>
                    </div>

                    <h3 className="text-3xl sm:text-7xl font-black italic uppercase leading-[0.85] text-slate-900 dark:text-white mb-6 sm:mb-8 tracking-tighter">
                      {selectedItem.name}
                    </h3>

                    <div className="flex items-center gap-8 mb-12">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 font-mono">STATUS</span>
                        <span className={`text-2xl font-black ${selectedItem.qty > 0 ? 'text-green-500' : 'text-vault-accent'}`}>
                          {selectedItem.qty > 0 ? `IN VAULT [${selectedItem.qty}]` : 'DEPLETED'}
                        </span>
                      </div>
                      <div className="w-px h-12 bg-slate-200 dark:bg-white/10" />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 font-mono">CONDITION</span>
                        <span className="text-2xl font-black text-vault-cyan uppercase">{selectedItem.condition || 'AUTHENTIC'}</span>
                      </div>
                    </div>

                    <div className="p-6 sm:p-10 bg-slate-50 dark:bg-black rounded-2xl sm:rounded-3xl border-2 border-slate-100 dark:border-white/5 mb-8 sm:mb-12">
                      <p className="text-[10px] sm:text-[11px] font-black text-slate-400 dark:text-vault-accent uppercase tracking-[0.4em] mb-3 sm:mb-4">Certified Valuation</p>
                      <p className="text-4xl sm:text-7xl font-black text-vault-accent italic tracking-tighter leading-none">{formatRupiah(selectedItem.price)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <button
                      onClick={() => { addToCart(selectedItem); setIsCartOpen(true); setIsModalOpen(false); }}
                      className="py-7 bg-vault-accent text-white rounded-2xl font-black shadow-xl hover:translate-y-[-4px] transition-all uppercase tracking-widest text-[12px] border-b-4 border-vault-accent/50"
                    >
                      ACQUIRE TO DECK
                    </button>
                    <button
                      onClick={() => { addToCart(selectedItem); setIsModalOpen(false); }}
                      className="py-7 bg-slate-900 dark:bg-vault-charcoal text-white rounded-2xl font-black hover:bg-vault-cyan hover:text-black transition-all uppercase tracking-widest text-[12px]"
                    >
                      ADD TO COLLECTION
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div >
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div></div>}>
      <MainContent />
    </Suspense>
  )
}
