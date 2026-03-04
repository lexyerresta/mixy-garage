"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

type ItemImageProps = {
    itemName: string
    className?: string
    priority?: boolean
}

// Global cache for image mapping (loaded once)
let imageMapping: Record<string, string> | null = null
let mappingPromise: Promise<Record<string, string>> | null = null

// Function to load mapping once and cache it
async function getImageMapping(): Promise<Record<string, string>> {
    if (imageMapping) return imageMapping
    if (mappingPromise) return mappingPromise

    mappingPromise = fetch('/item-images.json')
        .then(res => res.json())
        .then(data => {
            imageMapping = data
            mappingPromise = null
            return data
        })
        .catch(error => {
            console.error('Failed to load image mapping:', error)
            mappingPromise = null
            return {}
        })

    return mappingPromise
}

export function ItemImage({ itemName, className = "", priority = false }: ItemImageProps) {
    const [imageUrl, setImageUrl] = useState<string>("/tcg-fallback.svg")
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadImage = async () => {
            const mapping = await getImageMapping()
            const url = mapping[itemName] || '/tcg-fallback.svg'
            setImageUrl(url)
            setIsLoading(false)
        }
        loadImage()
    }, [itemName])

    const isPremium = itemName.toLowerCase().includes("parallel") ||
        itemName.toLowerCase().includes("serial number") ||
        itemName.toLowerCase().includes("ultra rare") ||
        itemName.toLowerCase().includes("illustration") ||
        itemName.toLowerCase().includes("alternate art") ||
        itemName.toLowerCase().includes("promo")

    return (
        <div className={`relative w-full h-full bg-slate-100 dark:bg-zinc-800 rounded-2xl overflow-hidden flex items-center justify-center p-4 pokedex-screen ${isPremium ? 'pk-holo-rare' : ''}`}>
            {isLoading && (
                <div className="absolute inset-0 bg-slate-200 dark:bg-white/5 animate-pulse rounded-2xl" />
            )}

            <Image
                src={imageUrl}
                alt={itemName}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className={`object-contain transition-transform duration-700 group-hover:scale-110 drop-shadow-[0_20px_20px_rgba(0,0,0,0.15)] ${className}`}
                priority={priority}
                loading={priority ? undefined : "lazy"}
                quality={90}
            />

            {/* Subtle Interactive Overlay */}
            <div className="absolute inset-0 ring-1 ring-inset ring-black/5 pointer-events-none rounded-2xl" />
        </div>
    )
}

