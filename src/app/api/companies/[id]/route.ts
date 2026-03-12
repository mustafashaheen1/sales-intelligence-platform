import { NextRequest, NextResponse } from "next/server";
import { getCompany } from "@/lib/airtable";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const company = await getCompany(params.id);
    return NextResponse.json({ company });
  } catch (error) {
    console.error("Error fetching company:", error);
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }
}
