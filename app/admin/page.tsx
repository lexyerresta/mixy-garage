"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Search,
    Save,
    LogOut,
    Upload,
    RefreshCw,
    FileSpreadsheet,
    Package,
    LayoutGrid,
    ChevronDown
} from "lucide-react";
import { ItemImage } from "@/components/ItemImage";
import { ToastContainer, ToastMessage, ToastType } from "@/components/Toast";

type PriceItem = {
    name: string;
    category: string;
    subcategory: string | null;
    qty: number;
    price: number;
    condition?: string;
};

export default function AdminDashboard() {
    const [items, setItems] = useState<PriceItem[]>([]);
    const [filteredItems, setFilteredItems] = useState<PriceItem[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const router = useRouter();

    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = (message: string, type: ToastType = "success") => {
        const id = Math.random().toString(36).substring(7);
        setToasts((prev) => [...prev, { id, message, type }]);
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    const fetchItems = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/prices");
            if (res.ok) {
                const data = await res.json();
                setItems(data);
                setFilteredItems(data);
            }
        } catch (error) {
            console.error("Failed to fetch prices:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    useEffect(() => {
        if (!search) {
            setFilteredItems(items);
            return;
        }
        const lower = search.toLowerCase();
        setFilteredItems(
            items.filter(
                (item) =>
                    item.name.toLowerCase().includes(lower) ||
                    (item.subcategory?.toLowerCase().includes(lower)) ||
                    item.category.toLowerCase().includes(lower)
            )
        );
    }, [search, items]);

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/admin/login");
        router.refresh();
    };

    const handleUpdateItem = (index: number, field: keyof PriceItem, value: any) => {
        const originalItem = filteredItems[index];
        const realIndex = items.findIndex((i) => i.name === originalItem.name);

        if (realIndex === -1) return;

        const newItems = [...items];
        newItems[realIndex] = { ...newItems[realIndex], [field]: value };
        setItems(newItems);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/admin/prices", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(items),
            });
            if (res.ok) {
                addToast("Prices saved successfully!", "success");
            } else {
                addToast("Failed to save prices.", "error");
            }
        } catch (error) {
            addToast("Error saving prices.", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/admin/upload-prices", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (res.ok && data.success) {
                addToast(`Successfully uploaded ${data.updated} items.`, "success");
                fetchItems();
            } else {
                addToast(data.error || "Failed to upload file.", "error");
            }
        } catch (error) {
            addToast("Error uploading file.", "error");
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    const uniqueCategories = Array.from(new Set(items.map(i => i.category))).sort();

    return (
        <div className="space-y-6 pb-20 p-4 sm:p-8 max-w-7xl mx-auto min-h-screen bg-slate-50 dark:bg-[#0B1120] transition-colors duration-300">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Mixy <span className="text-orange-500">Garage</span> Admin</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Premium Inventory Management</p>
                </div>
                <div className="flex-1" />
            </div>

            <div className="sticky top-4 z-40 bg-white/80 dark:bg-[#151e32]/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500" />
                    <input
                        type="text"
                        placeholder="Search items, series, or categories..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-slate-100 dark:bg-[#0B1120] border border-transparent rounded-2xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 focus:bg-white dark:focus:bg-[#0B1120] outline-none transition-all font-bold"
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <label className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-2xl text-sm font-black transition-all shadow-lg shadow-green-500/20 cursor-pointer active:scale-95">
                        {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                        <span>UPLOAD EXCEL</span>
                        <input type="file" accept=".xlsx" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                    </label>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-sm font-black transition-all shadow-lg shadow-orange-500/20 active:scale-95 disabled:opacity-50"
                    >
                        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>SAVE CHANGES</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-40">
                    <RefreshCw className="w-12 h-12 animate-spin text-orange-500 mb-6 opacity-80" />
                    <span className="text-slate-400 font-black uppercase tracking-widest text-sm">Syncing Vault Database...</span>
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-40 bg-white dark:bg-[#151e32] border border-slate-200 dark:border-white/10 rounded-3xl h-64 shadow-inner">
                    <Package className="w-12 h-12 text-slate-200 dark:text-slate-800 mb-4" />
                    <span className="text-slate-400 font-bold">No results found for "{search}"</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredItems.map((item, idx) => (
                        <div key={`${item.name}-${idx}`} className="bg-white dark:bg-[#151e32] p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col gap-6 relative group hover:shadow-xl hover:border-orange-500/30 transition-all">
                            <div className="flex items-start gap-4">
                                <div className="w-24 h-24 shrink-0 bg-slate-50 dark:bg-[#0B1120] rounded-2xl overflow-hidden border border-slate-100 dark:border-white/5 flex items-center justify-center p-3 relative shadow-inner">
                                    <ItemImage itemName={item.name} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white truncate mb-1" title={item.name}>{item.name}</h3>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-500 text-[10px] font-black uppercase rounded-md border border-orange-200 dark:border-orange-500/20 tracking-tighter">{item.category}</span>
                                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase rounded-md border border-slate-200 dark:border-white/10 tracking-tighter">{item.subcategory || "N/A"}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">STOCK</label>
                                    <input
                                        type="number"
                                        value={item.qty}
                                        onChange={(e) => handleUpdateItem(idx, "qty", parseInt(e.target.value) || 0)}
                                        className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-center font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">PRICE (IDR)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={item.price}
                                            onChange={(e) => handleUpdateItem(idx, "price", parseInt(e.target.value) || 0)}
                                            className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-right font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                        />
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">Rp</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">CATEGORY</label>
                                    <select
                                        value={item.category}
                                        onChange={(e) => handleUpdateItem(idx, "category", e.target.value)}
                                        className="w-full appearance-none bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 font-bold text-xs text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-orange-500"
                                    >
                                        <option value="Pokemon">Pokemon</option>
                                        <option value="One Piece">One Piece</option>
                                        {uniqueCategories.filter(c => c !== "Diecast" && c !== "Pokemon" && c !== "One Piece").map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">CONDITION / GRADING</label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            value={item.condition || ""}
                                            onChange={(e) => handleUpdateItem(idx, "condition", e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 font-bold text-xs text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-orange-500"
                                            placeholder="e.g. PSA 10, CGC, TAG, EGS, ZGS"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
}
