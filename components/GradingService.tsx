import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    ShieldCheck,
    HelpCircle,
    ChevronRight,
    ArrowRight,
    Info,
    Zap,
    Globe,
    Search,
    CheckCircle2,
    ChevronDown,
    MessageCircle,
    Award,
    BookOpen
} from "lucide-react"
import { GradingPriceCard } from "./GradingPriceCard"

const PSA_TIERS = [
    {
        title: "Value Bulk",
        subtitle: "Modern cards (1980-Present)",
        estimate: "19 Weeks (approx.)",
        maxValue: "Rp 7.500.000",
        price: "Rp 525.000",
        bulkPrices: [
            { label: "10-49 Cards", value: "Rp 510.000" },
            { label: "50+ Cards", value: "Rp 490.000" },
        ],
        notes: ["Estimasi waktu belum termasuk pengiriman bolak-balik US."]
    },
    {
        title: "Value PLUS",
        subtitle: "All card types",
        estimate: "9 Weeks (approx.)",
        maxValue: "Rp 7.500.000",
        price: "Rp 1.300.000",
        bulkPrices: [
            { label: "10-49 Cards", value: "Rp 1.000.000" },
            { label: "50+ Cards", value: "Rp 875.000" },
        ],
        isFeatured: true,
        notes: ["Optional: Min grade or Authentic only."]
    },
    {
        title: "Value MAX",
        subtitle: "High value artifacts",
        estimate: "7 Weeks (approx.)",
        maxValue: "Rp 15.000.000",
        price: "Rp 1.600.000",
        bulkPrices: [
            { label: "10-49 Cards", value: "Rp 1.375.000" },
            { label: "50+ Cards", value: "Rp 1.125.000" },
        ],
        notes: ["Optimal for cards valued up to $1,000."]
    },
    {
        title: "Reguler",
        subtitle: "Fastest standard service",
        estimate: "5 Weeks (approx.)",
        maxValue: "Rp 22.500.000",
        price: "Rp 1.850.000",
        bulkPrices: [
            { label: "10-49 Cards", value: "Rp 1.575.000" },
            { label: "50+ Cards", value: "Rp 1.325.000" },
        ],
        notes: ["Priority handling for high-value items."]
    }
]

const FAQ_DATA = [
    {
        k: "Harga & Asuransi",
        v: "Harga yang tertera adalah harga per kartu. Harga diskon berlaku untuk pengiriman di hari yang sama. Asuransi mencakup dari saat kartu diterima Mixy Garage sampai dikirim kembali oleh PSA."
    },
    {
        k: "Urutan Status PSA",
        v: "Status grading meliputi: Arrived, Pre-Grading, Grading, Assembly, Quality Check, dan Shipped. Anda akan menerima update berkala via dashboard."
    },
    {
        k: "Persiapan Pengiriman",
        v: "Kartu wajib menggunakan Penny Sleeve dan Card Saver (Semi-Rigid). Jangan menggunakan Toploader untuk pengiriman grading karena resiko card moving."
    },
    {
        k: "Apa itu Upcharge?",
        v: "Jika nilai kartu setelah grading melebihi 'Max Declared Value' di tier yang Anda pilih, PSA akan mengenakan upcharge ke tier yang sesuai."
    }
]

export const GradingService = () => {
    const [activeTab, setActiveTab] = useState<"PSA" | "CGC" | "BGS">("PSA")
    const [openFaq, setOpenFaq] = useState<number | null>(0)

    return (
        <div className="space-y-24 pb-20">
            {/* Intro Section */}
            <section className="relative p-12 sm:p-20 rounded-[4rem] bg-vault-charcoal overflow-hidden group shadow-2xl">
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-br from-vault-accent via-transparent to-vault-cyan" />
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-vault-accent/20 blur-[120px] rounded-full" />
                </div>

                <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-10">
                        <div className="inline-flex items-center gap-3 px-6 py-2 bg-vault-accent/10 border border-vault-accent/20 rounded-full text-vault-accent text-[10px] font-black uppercase tracking-[0.5em] backdrop-blur-md">
                            <ShieldCheck size={14} />
                            Authenticated Dealer
                        </div>

                        <h2 className="text-5xl sm:text-7xl font-black italic text-white uppercase leading-[0.85] tracking-tighter">
                            Why Mixy <br />
                            <span className="text-vault-gradient">Grading?</span>
                        </h2>

                        <div className="space-y-6 text-slate-400 text-sm sm:text-lg font-medium leading-relaxed tracking-wide">
                            <p>
                                Sejak berdiri, Mixy Garage telah menjadi pilihan terpercaya bagi para kolektor di Indonesia.
                                Mixy Grading Submission kini hadir dengan pilihan servis terlengkap, memastikan setiap kebutuhan kolektor dapat terpenuhi dengan standar terbaik.
                            </p>
                            <p className="p-6 rounded-3xl bg-white/5 border border-white/10 italic text-vault-cyan">
                                "MIXY GARAGE MERUPAKAN DEALER RESMI UNTUK PSA DAN CGC DI INDONESIA."
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            {[
                                { label: "Authorized Dealer", icon: <Award /> },
                                { label: "Insured Shipping", icon: <Globe /> },
                                { label: "Expert Handling", icon: <Search /> }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase text-slate-300">
                                    {React.cloneElement(item.icon as React.ReactElement, { size: 14, className: "text-vault-accent" })}
                                    {item.label}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute -inset-4 bg-vault-accent/20 blur-2xl rounded-full animate-pulse" />
                        <div className="relative rounded-[3rem] overflow-hidden border-2 border-white/10 shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-700">
                            <img
                                src="https://images.unsplash.com/photo-1613771404721-1f92d799e49f?auto=format&fit=crop&q=80&w=800"
                                alt="Grading Cards"
                                className="w-full aspect-[4/3] object-cover scale-110 group-hover:scale-100 transition-transform duration-1000"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-vault-black/80 via-transparent to-transparent" />
                            <div className="absolute bottom-8 left-8 right-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl">
                                        <img src="/logo-mixy.png" alt="Mixy" className="w-8 h-8 object-contain" />
                                    </div>
                                    <div>
                                        <p className="text-white font-black text-sm uppercase tracking-widest">Authentication Lab</p>
                                        <p className="text-vault-accent text-[10px] font-bold uppercase tracking-widest">Securing Legacies</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Header */}
            <section className="space-y-12">
                <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-6">
                    <div className="w-20 h-1 bg-vault-accent rounded-full" />
                    <h2 className="text-4xl sm:text-6xl font-black italic text-slate-900 dark:text-white uppercase tracking-tighter">
                        Service <span className="text-vault-accent">Tiers</span>
                    </h2>
                    <p className="text-slate-500 text-sm sm:text-lg font-medium tracking-wide">
                        Pilih level servis yang sesuai dengan nilai kartu dan kecepatan yang Anda butuhkan.
                        Semua kartu diasuransikan selama perjalanan.
                    </p>

                    <div className="flex p-2 bg-slate-100 dark:bg-vault-charcoal rounded-3xl border-2 border-slate-200 dark:border-white/10 shadow-inner mt-8">
                        {["PSA", "CGC", "BGS"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-10 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === tab
                                        ? "bg-vault-accent text-white shadow-xl"
                                        : "text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                    }`}
                            >
                                {tab} Service
                            </button>
                        ))}
                    </div>
                </div>

                {/* Pricing Grid */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8"
                    >
                        {PSA_TIERS.map((tier, i) => (
                            <GradingPriceCard key={i} {...tier} />
                        ))}
                    </motion.div>
                </AnimatePresence>
            </section>

            {/* FAQ Section */}
            <section className="grid lg:grid-cols-3 gap-16 items-start">
                <div className="lg:col-span-1 space-y-6 sticky top-40">
                    <div className="p-6 rounded-[2.5rem] bg-vault-accent/10 border border-vault-accent/20 text-vault-accent w-fit">
                        <BookOpen size={40} />
                    </div>
                    <h2 className="text-4xl font-black italic text-slate-900 dark:text-white uppercase tracking-tighter leading-none">
                        Submission <br />
                        <span className="text-vault-accent">FAQ</span>
                    </h2>
                    <p className="text-slate-500 font-medium text-sm leading-relaxed">
                        Semua yang perlu Anda ketahui sebelum mengirimkan kartu berharga Anda ke lab autentikasi kami.
                    </p>
                    <button className="flex items-center gap-3 text-vault-accent font-black text-xs uppercase tracking-widest hover:gap-5 transition-all">
                        Full Policy Guide <ArrowRight size={16} />
                    </button>
                </div>

                <div className="lg:col-span-2 space-y-4">
                    {FAQ_DATA.map((faq, i) => (
                        <div
                            key={i}
                            className={`rounded-3xl border-2 transition-all overflow-hidden ${openFaq === i
                                    ? "border-vault-accent bg-vault-accent/[0.02]"
                                    : "border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10"
                                }`}
                        >
                            <button
                                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                className="w-full flex items-center justify-between p-8 text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${openFaq === i ? "bg-vault-accent text-white" : "bg-slate-100 dark:bg-vault-charcoal text-slate-400"
                                        }`}>
                                        {i + 1}
                                    </div>
                                    <span className="text-sm sm:text-lg font-black uppercase tracking-tight text-slate-800 dark:text-slate-100">
                                        {faq.k}
                                    </span>
                                </div>
                                <ChevronDown className={`transition-transform duration-300 ${openFaq === i ? "rotate-180 text-vault-accent" : "text-slate-400"}`} />
                            </button>

                            <AnimatePresence>
                                {openFaq === i && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div className="px-8 pb-8 pt-0 ml-12">
                                            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base leading-relaxed font-medium">
                                                {faq.v}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA Footer */}
            <section className="text-center p-16 sm:p-24 rounded-[4rem] bg-gradient-to-tr from-vault-accent to-vault-cyan relative overflow-hidden group">
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-500" />
                <div className="relative z-10 space-y-10">
                    <h2 className="text-4xl sm:text-7xl font-black italic text-white uppercase tracking-tighter leading-[0.85]">
                        Ready to Grade <br />
                        Your Collection?
                    </h2>
                    <p className="text-white/80 font-bold uppercase tracking-widest text-sm max-w-xl mx-auto">
                        Hubungi tim kami untuk konsultasi gratis mengenai potensi grade dan pilihan tier terbaik untuk kartu Anda.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-6">
                        <button className="px-12 py-5 bg-white text-vault-accent font-black rounded-2xl shadow-2xl shadow-black/20 hover:translate-y-[-5px] transition-all uppercase tracking-widest text-xs">
                            Submit via WhatsApp
                        </button>
                        <button className="px-12 py-5 bg-transparent border-2 border-white/30 text-white font-black rounded-2xl hover:bg-white/10 transition-all uppercase tracking-widest text-xs">
                            View Submission Form
                        </button>
                    </div>
                </div>
            </section>
        </div>
    )
}
