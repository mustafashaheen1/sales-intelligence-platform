import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import Airtable from "airtable";

// One-time endpoint to hash and store the initial user password.
// Disable or delete after first use.
export async function POST(request: NextRequest) {
  const { email, password, setupKey } = await request.json();

  if (setupKey !== "INITIAL_SETUP_2024") {
    return NextResponse.json({ error: "Invalid setup key" }, { status: 403 });
  }

  if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
    return NextResponse.json({ error: "Airtable not configured" }, { status: 500 });
  }

  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

  try {
    const records = await base("Users")
      .select({ filterByFormula: `{Email} = '${email}'`, maxRecords: 1 })
      .firstPage();

    if (records.length === 0) {
      await base("Users").create({
        Email: email,
        Password: hashPassword(password),
        Name: "Mustafa Shaheen",
      });
    } else {
      await base("Users").update(records[0].id, { Password: hashPassword(password) });
    }

    return NextResponse.json({ success: true, message: "User setup complete" });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json({ error: "Setup failed" }, { status: 500 });
  }
}
