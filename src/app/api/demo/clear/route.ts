import { NextResponse } from 'next/server';
import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID!);
const leadsTable = base('Leads');

export async function POST() {
  try {
    console.log('=== CLEARING DEMO LEADS ===');

    // Identify demo leads by their phone pattern (+1555010x)
    const records = await leadsTable.select({
      filterByFormula: `FIND("5550", {Phone}) > 0`,
    }).all();

    console.log(`Found ${records.length} demo leads to delete`);

    if (records.length === 0) {
      return NextResponse.json({ success: true, message: 'No demo leads found to clear', count: 0 });
    }

    // Delete in batches of 10 (Airtable max per request)
    const ids = records.map((r) => r.id);
    for (let i = 0; i < ids.length; i += 10) {
      await leadsTable.destroy(ids.slice(i, i + 10));
      console.log(`Deleted batch of ${Math.min(10, ids.length - i)}`);
    }

    console.log(`Cleared ${records.length} demo leads`);
    return NextResponse.json({ success: true, count: records.length, message: `Cleared ${records.length} demo lead${records.length !== 1 ? 's' : ''}` });
  } catch (error) {
    console.error('Error clearing demo leads:', error);
    return NextResponse.json({ success: false, error: 'Failed to clear demo leads' }, { status: 500 });
  }
}
