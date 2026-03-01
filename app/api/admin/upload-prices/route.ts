import { NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { writeFile, readFile } from "fs/promises"
import { join } from "path"

type PriceItem = {
    name: string;
    category: string;
    subcategory?: string | null;
    price: number;
    qty?: number | null;
};

export async function POST(req: Request) {
    try {
        const formData = await req.formData()
        const file = formData.get("file") as File

        if (!file) {
            return NextResponse.json({ success: false, error: "Missing file." }, { status: 400 })
        }

        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer)
        const sheetName = workbook.SheetNames[0]
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]) as any[]

        // Validation & Mapping
        const validated: PriceItem[] = data.map(item => ({
            name: String(item.name || item.Name || ""),
            category: String(item.category || item.Category || "Diecast"),
            subcategory: item.subcategory || item.Subcategory || item.hero || item.Hero || null,
            price: Number(item.price || item.Price || 0),
            qty: Number(item.qty || item.Qty || item.quantity || item.Quantity || 0)
        })).filter(i => i.name.length > 0);

        if (validated.length === 0) {
            return NextResponse.json({ success: false, error: "No valid items found in the Excel sheet." }, { status: 400 })
        }

        const pricesPath = join(process.cwd(), "public", "prices.json")
        await writeFile(pricesPath, JSON.stringify(validated, null, 2))

        return NextResponse.json({ success: true, updated: validated.length })
    } catch (error) {
        console.error("Error processing upload:", error);
        return NextResponse.json({ success: false, error: "Failed to process the uploaded file." }, { status: 500 });
    }
}
