import { NextRequest, NextResponse } from "next/server";
import { createLead } from "@/lib/airtable";
import { getScoreLabel } from "@/lib/utils";
import Papa from "papaparse";

function isDemoMode() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !process.env.AIRTABLE_API_KEY;
}

const FIELD_MAP: Record<string, string> = {
  name: "name",
  full_name: "name",
  fullname: "name",
  email: "email",
  email_address: "email",
  phone: "phone",
  phone_number: "phone",
  company: "company",
  company_name: "company",
  title: "title",
  job_title: "title",
  position: "title",
  linkedin: "linkedinUrl",
  linkedin_url: "linkedinUrl",
  linkedin_profile: "linkedinUrl",
  source: "leadSource",
  lead_source: "leadSource",
  notes: "notes",
  note: "notes",
};

function normalizeRow(row: Record<string, string>) {
  const lead: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    const normalized = key.toLowerCase().replace(/\s+/g, "_");
    const mappedKey = FIELD_MAP[normalized];
    if (mappedKey && value?.trim()) {
      lead[mappedKey] = value.trim();
    }
  }
  return lead;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const text = await file.text();
    const { data, errors } = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
    });

    if (errors.length && !data.length) {
      return NextResponse.json({ error: "Failed to parse CSV" }, { status: 400 });
    }

    const rows = data.map(normalizeRow).filter((r) => r.name || r.email);

    if (!rows.length) {
      return NextResponse.json(
        { error: "No valid rows found. CSV must have at least a 'name' or 'email' column." },
        { status: 400 }
      );
    }

    if (isDemoMode()) {
      const imported = rows.map((data, i) => {
        const score = Math.floor(Math.random() * 60) + 30;
        return {
          id: `rec_import_${Date.now()}_${i}`,
          ...data,
          status: "New",
          aiScore: score,
          aiScoreLabel: getScoreLabel(score),
          createdAt: new Date().toISOString(),
        };
      });
      return NextResponse.json({ imported: imported.length });
    }

    let imported = 0;
    for (const row of rows) {
      try {
        await createLead({ ...row, status: "New" });
        imported++;
      } catch (err) {
        console.error("Failed to import lead:", row.name || row.email, err);
      }
    }

    return NextResponse.json({ imported });
  } catch (error) {
    console.error("CSV import error:", error);
    return NextResponse.json({ error: "Failed to import leads" }, { status: 500 });
  }
}
