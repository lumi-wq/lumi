import { NextResponse } from "next/server";
import { searchCities, getWarehouses } from "@/lib/novaposhta";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  try {
    if (action === "cities") {
      const q = searchParams.get("q") ?? "";
      if (q.length < 2) return NextResponse.json({ cities: [] });
      return NextResponse.json({ cities: await searchCities(q) });
    }
    if (action === "warehouses") {
      const cityRef = searchParams.get("city");
      if (!cityRef) return NextResponse.json({ warehouses: [] });
      return NextResponse.json({ warehouses: await getWarehouses(cityRef) });
    }
    return NextResponse.json({ error: "Невідома дія" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Помилка Нової Пошти" }, { status: 502 });
  }
}
