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
    const [imageUrl, setImageUrl] = useState<string>("/icon.png")
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadImage = async () => {
            const mapping = await getImageMapping()
            const url = mapping[itemName] || '/icon.png'
            setImageUrl(url)
            setIsLoading(false)
        }
        loadImage()
    }, [itemName])

    return (
        <div className="relative w-full h-full bg-slate-50 dark:bg-[#0B1120] rounded-lg">
            {isLoading && (
                <div className="absolute inset-0 bg-slate-100 dark:bg-white/5 animate-pulse rounded-lg" />
            )}
            <Image
                src={imageUrl}
                alt={itemName}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className={`object-contain ${className}`}
                priority={priority}
                loading={priority ? undefined : "lazy"}
                quality={85}
                onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/icon.png'
                }}
            />
        </div>
    )
}
