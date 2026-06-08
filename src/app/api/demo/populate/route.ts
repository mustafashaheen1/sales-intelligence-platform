import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';
import { getRandomDemoLeads } from '@/lib/demo-data';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID!);
const leadsTable = base('Leads');

export async function POST(request: NextRequest) {
  try {
    const { count = 8 } = await request.json().catch(() => ({}));

    console.log('=== POPULATING DEMO LEADS ===');
    const demoLeads = getRandomDemoLeads(count);
    const createdLeads: { id: string; name: string; company: string }[] = [];

    for (const lead of demoLeads) {
      try {
        const fields: Record<string, any> = {
          'Name': lead.name,
          'Email': lead.email,
          'Phone': lead.phone,
          'Company': lead.company,
          'Title': lead.title,
          'Status': lead.status,
          'AI Score': lead.aiScore || null,
        };

        const record = await leadsTable.create(fields);
        createdLeads.push({ id: record.id, name: lead.name, company: lead.company });
        console.log('Created demo lead:', lead.name);
      } catch (err) {
        console.error('Error creating lead:', lead.name, err);
      }
    }

    console.log(`Created ${createdLeads.length} demo leads`);
    return NextResponse.json({ success: true, count: createdLeads.length, leads: createdLeads });
  } catch (error) {
    console.error('Error populating demo leads:', error);
    return NextResponse.json({ success: false, error: 'Failed to populate demo leads' }, { status: 500 });
  }
}
