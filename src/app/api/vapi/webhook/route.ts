import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID!);
const leadsTable = base('Leads');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const messageType = body.message?.type || body.type;

    console.log('=== VAPI WEBHOOK RECEIVED ===');
    console.log('Message type:', messageType);

    // Only process end-of-call-report events
    if (messageType !== 'end-of-call-report') {
      console.log('Ignoring non-end-of-call event');
      return NextResponse.json({ success: true, message: 'Ignored' });
    }

    const call = body.message?.call || body.call || body;
    const analysis = call.analysis || {};
    const structuredData = analysis.structuredData || {};

    console.log('Call ID:', call.id);
    console.log('Analysis:', JSON.stringify(analysis, null, 2));
    console.log('Structured Data:', JSON.stringify(structuredData, null, 2));

    // Extract call data
    const callSummary = structuredData.call_summary || analysis.summary || 'Call completed';
    const callOutcome = structuredData.qualification_status || structuredData.call_outcome || 'UNKNOWN';
    const painPoints = structuredData.pain_points || '';
    const budgetRange = structuredData.budget_range || '';
    const timeline = structuredData.timeline || '';
    const isDecisionMaker = structuredData.is_decision_maker;
    const nextSteps = structuredData.next_steps || '';
    const meetingScheduled = structuredData.meeting_scheduled || false;
    const scheduledTime = structuredData.scheduled_time || '';

    // Calculate duration
    let duration = 0;
    if (call.startedAt && call.endedAt) {
      duration = Math.round((new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000);
    }

    // Get lead ID from metadata
    const leadId = call.metadata?.leadId || call.assistantOverrides?.metadata?.leadId;

    if (!leadId) {
      console.error('No leadId found in call metadata');
      return NextResponse.json({ success: false, error: 'No leadId in metadata' }, { status: 400 });
    }

    console.log('Lead ID from metadata:', leadId);

    // Fetch current lead data
    let leadRecord;
    try {
      leadRecord = await leadsTable.find(leadId);
    } catch (findError) {
      console.error('Failed to find lead:', findError);
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    const currentFields = leadRecord.fields;
    const currentCallCount = (currentFields['Call Count'] as number) || 0;

    // Parse existing call history
    let callHistory: any[] = [];
    if (currentFields['Call History']) {
      try {
        callHistory = JSON.parse(currentFields['Call History'] as string);
      } catch {
        callHistory = [];
      }
    }

    // Add new call entry
    const newCallEntry = {
      id: call.id,
      date: new Date().toISOString(),
      duration,
      outcome: callOutcome,
      summary: callSummary,
      painPoints,
      budgetRange,
      timeline,
      isDecisionMaker,
      nextSteps,
      meetingScheduled,
      scheduledTime,
    };
    callHistory.push(newCallEntry);

    // Calculate next follow-up date
    let nextFollowUpDate: string | null = null;
    if (callOutcome === 'QUALIFIED' || callOutcome === 'INTERESTED') {
      nextFollowUpDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    } else if (callOutcome === 'FOLLOW_UP' || callOutcome === 'CALLBACK') {
      nextFollowUpDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    } else if (callOutcome === 'NOT_INTERESTED') {
      nextFollowUpDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }

    // Build update object with EXACT Airtable field names
    const updateFields: Record<string, any> = {
      'Call Count': currentCallCount + 1,
      'Last Call Summary': callSummary,
      'Last Call Date': new Date().toISOString().split('T')[0],
      'Call History': JSON.stringify(callHistory),
      'Vapi Call Status': 'Completed',
      'Vapi Call Summary': callSummary,
    };

    if (nextFollowUpDate) {
      updateFields['Next Follow Up'] = nextFollowUpDate;
    }

    if (meetingScheduled && scheduledTime) {
      updateFields['Scheduled Meeting'] = scheduledTime;
      updateFields['Status'] = 'Meeting Scheduled';
    }

    console.log('=== UPDATING AIRTABLE ===');
    console.log('Lead ID:', leadId);
    console.log('Update fields:', JSON.stringify(updateFields, null, 2));

    try {
      await leadsTable.update(leadId, updateFields);
      console.log('Airtable update SUCCESS');
    } catch (updateError) {
      console.error('Airtable update FAILED:', updateError);
      return NextResponse.json({
        success: false,
        error: updateError instanceof Error ? updateError.message : 'Update failed',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      leadId,
      callCount: currentCallCount + 1,
      outcome: callOutcome,
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook failed' },
      { status: 500 }
    );
  }
}
