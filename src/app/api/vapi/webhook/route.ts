import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';
import { generateMeetingLink } from '@/lib/calendly';
import { parseScheduledTime } from '@/lib/google-calendar';
import { scoreLeadWithCallData } from '@/lib/langchain';
import { findLeadByPhoneOrEmail, getLead } from '@/lib/airtable';
import { buildCallContext, generateSystemPrompt } from '@/lib/call-context';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID!);
const leadsTable = base('Leads');

// Parse Vapi's UUID-keyed structured outputs into a simple key-value object
function parseStructuredOutputs(structuredOutputs: Record<string, any>): Record<string, any> {
  const parsed: Record<string, any> = {};

  if (!structuredOutputs || typeof structuredOutputs !== 'object') {
    return parsed;
  }

  for (const key of Object.keys(structuredOutputs)) {
    const item = structuredOutputs[key];
    if (item && typeof item === 'object' && 'name' in item && 'result' in item) {
      parsed[item.name] = item.result;
    }
  }

  console.log('=== PARSED STRUCTURED OUTPUTS ===');
  console.log(JSON.stringify(parsed, null, 2));

  return parsed;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Log the COMPLETE body structure to find where structured data lives
    console.log('=== FULL VAPI WEBHOOK BODY ===');
    console.log(JSON.stringify(body, null, 2));

    console.log('=== TOP LEVEL KEYS ===');
    console.log(Object.keys(body));

    console.log('=== CHECKING STRUCTURED DATA LOCATIONS ===');
    console.log('body.analysis:', JSON.stringify(body.analysis));
    console.log('body.structuredData:', JSON.stringify(body.structuredData));
    console.log('body.message keys:', JSON.stringify(body.message ? Object.keys(body.message) : 'undefined'));
    console.log('body.message?.analysis:', JSON.stringify(body.message?.analysis));
    console.log('body.message?.structuredData:', JSON.stringify(body.message?.structuredData));
    console.log('body.message?.call?.analysis:', JSON.stringify(body.message?.call?.analysis));
    console.log('body.call?.analysis:', JSON.stringify(body.call?.analysis));

    const messageType = body.message?.type || body.type;

    console.log('=== VAPI WEBHOOK RECEIVED ===');
    console.log('Message type:', messageType);

    // Handle assistant-request (inbound calls — Vapi asks us which assistant to use)
    if (messageType === 'assistant-request') {
      console.log('=== INBOUND CALL - ASSISTANT REQUEST ===');
      const callerPhone =
        body.message?.call?.customer?.number ||
        body.message?.customer?.number ||
        '';
      console.log('Caller phone:', callerPhone);

      if (!callerPhone) {
        return NextResponse.json({
          assistant: {
            firstMessage: "Hi, this is Sarah from Coder Crew. How can I help you today?",
          },
        });
      }

      try {
        const { existingLead } = await findLeadByPhoneOrEmail(callerPhone, undefined);

        if (existingLead) {
          console.log('Found lead for inbound call:', existingLead.id, existingLead.name);
          const context = buildCallContext(existingLead);
          const basePrompt = generateSystemPrompt(existingLead, context);
          const inboundSection = `## This is an INBOUND call — the prospect called you\nThank them for calling. Be ready to answer questions about Coder Crew's services. If they want to schedule a demo, offer available times.\n\n`;
          const systemPrompt = inboundSection + basePrompt;

          const firstName = existingLead.name?.split(' ')[0] || 'there';
          return NextResponse.json({
            assistant: {
              model: {
                provider: process.env.VAPI_MODEL_PROVIDER || 'openai',
                model: process.env.VAPI_MODEL_NAME || 'gpt-4o',
                messages: [{ role: 'system', content: systemPrompt }],
              },
              firstMessage: `Hi ${firstName}, this is Sarah from Coder Crew. Thanks for calling! How can I help you today?`,
            },
            metadata: { leadId: existingLead.id, callType: 'inbound' },
          });
        } else {
          console.log('Unknown caller:', callerPhone);
          return NextResponse.json({
            assistant: {
              firstMessage: "Hi, this is Sarah from Coder Crew. Thanks for calling! Who am I speaking with?",
            },
            metadata: { callType: 'inbound', callerPhone },
          });
        }
      } catch (lookupError) {
        console.error('Error looking up lead for inbound call:', lookupError);
        return NextResponse.json({
          assistant: {
            firstMessage: "Hi, this is Sarah from Coder Crew. How can I help you today?",
          },
        });
      }
    }

    // Only process end-of-call-report events beyond this point
    if (messageType !== 'end-of-call-report') {
      console.log('Ignoring non-end-of-call event:', messageType);
      return NextResponse.json({ success: true, message: 'Ignored' });
    }

    const call = body.message?.call || body.call || body;

    // Structured outputs live in artifact.structuredOutputs, NOT analysis.structuredData
    const artifact = body.message?.artifact || {};
    const rawStructuredData = artifact.structuredOutputs || {};

    console.log('Call ID:', call.id);
    console.log('=== ARTIFACT STRUCTURED OUTPUTS ===');
    console.log(JSON.stringify(rawStructuredData, null, 2));

    const structuredData = parseStructuredOutputs(rawStructuredData);

    // Summary comes from analysis, not structured outputs
    const analysis = body.message?.analysis || {};
    const summaryFromAnalysis = analysis.summary || body.message?.summary || '';

    // Extract call data from parsed structured outputs
    const callSummaryFromStructured = structuredData.call_summary || '';
    const callSummary = callSummaryFromStructured || summaryFromAnalysis || 'Call completed';
    const callOutcome = structuredData.qualification_status || structuredData.call_outcome || 'UNKNOWN';
    const painPoints = structuredData.pain_points || '';
    const budgetRange = structuredData.budget_range || '';
    const timeline = structuredData.timeline || '';
    const isDecisionMaker = structuredData.is_decision_maker === true;
    const nextSteps = structuredData.next_steps || '';
    const meetingScheduled = structuredData.meeting_scheduled === true;
    const scheduledTime = structuredData.scheduled_time || '';

    console.log('=== EXTRACTED DATA ===');
    console.log('Meeting Scheduled:', meetingScheduled);
    console.log('Scheduled Time:', scheduledTime);
    console.log('Call Summary:', callSummary);
    console.log('Qualification Status:', callOutcome);

    // Calculate duration
    let duration = 0;
    if (call.startedAt && call.endedAt) {
      duration = Math.round((new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000);
    }

    // Get lead ID from metadata
    let leadId: string | undefined =
      call.metadata?.leadId || call.assistantOverrides?.metadata?.leadId;

    // Fallback: look up by caller phone (inbound calls from unknown/untagged flow)
    if (!leadId) {
      const callerPhone =
        body.message?.customer?.number || call.customer?.number || '';
      if (callerPhone) {
        console.log('No leadId in metadata — looking up by phone:', callerPhone);
        try {
          const { existingLead } = await findLeadByPhoneOrEmail(callerPhone, undefined);
          if (existingLead) {
            leadId = existingLead.id;
            console.log('Found lead by phone:', leadId);
          }
        } catch (phoneLookupError) {
          console.error('Phone lookup failed:', phoneLookupError);
        }
      }
    }

    if (!leadId) {
      console.log('No lead ID found — cannot save call data');
      return NextResponse.json({ success: true, message: 'No lead to update' });
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
      id: call.id || crypto.randomUUID(),
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
      console.log('Meeting scheduled for:', scheduledTime);
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

    // Recalculate AI Score based on call outcome
    console.log('=== RECALCULATING AI SCORE ===');
    try {
      const existingAiScore = leadRecord.fields['AI Score'] as number | undefined;
      const existingAiScoreLabel = leadRecord.fields['AI Score Label'] as string | undefined;
      const existingAiInsights = leadRecord.fields['AI Insights'] as string | undefined;
      const existingKeyStrengths = leadRecord.fields['Key Strengths'] as string | undefined;
      const existingConcerns = leadRecord.fields['Concerns'] as string | undefined;
      const existingSuggestedNextStep = leadRecord.fields['Suggested Next Step'] as string | undefined;

      const leadForScoring = {
        name: leadRecord.fields['Name'] as string || '',
        company: leadRecord.fields['Company'] as string || '',
        title: leadRecord.fields['Title'] as string || '',
        aiScore: existingAiScore,
        aiScoreLabel: existingAiScoreLabel as any,
        aiInsights: existingAiInsights,
        keyStrengths: existingKeyStrengths ? JSON.parse(existingKeyStrengths) : [],
        concerns: existingConcerns ? JSON.parse(existingConcerns) : [],
        suggestedNextStep: existingSuggestedNextStep,
      };

      const scoreResult = await scoreLeadWithCallData(leadForScoring, {
        qualification_status: callOutcome,
        pain_points: painPoints,
        budget_range: budgetRange,
        timeline,
        is_decision_maker: isDecisionMaker,
        call_summary: callSummary,
        next_steps: nextSteps,
      });

      console.log('New AI Score:', scoreResult.score, scoreResult.scoreLabel);
      console.log('Follow-up timing:', scoreResult.followUpTiming);

      const scoreUpdate: Record<string, any> = {
        'AI Score': scoreResult.score,
        'AI Score Label': scoreResult.scoreLabel,
        'AI Insights': scoreResult.insights,
        'Key Strengths': JSON.stringify(scoreResult.keyStrengths),
        'Concerns': JSON.stringify(scoreResult.concerns),
        'Suggested Next Step': scoreResult.suggestedNextStep,
      };
      await leadsTable.update(leadId, scoreUpdate);
      console.log('AI Score updated in Airtable');
    } catch (scoreError) {
      console.error('Error calculating AI score:', scoreError);
    }

    // Generate and save Calendly meeting link when a meeting was scheduled
    if (meetingScheduled && scheduledTime) {
      console.log('=== GENERATING MEETING LINK ===');

      const parsedTime = parseScheduledTime(scheduledTime);
      if (parsedTime) {
        console.log('Parsed meeting time:', parsedTime.toISOString());
      }

      const calendlyLink = await generateMeetingLink();
      if (calendlyLink) {
        console.log('Calendly link generated:', calendlyLink);
        try {
          await leadsTable.update(leadId, { 'Meeting Link': calendlyLink });
          console.log('Meeting link saved to Airtable');
        } catch (linkError) {
          console.error('Error saving meeting link:', linkError);
        }

        // Send meeting link email via n8n
        const N8N_WEBHOOK_URL = process.env.N8N_MEETING_EMAIL_WEBHOOK_URL;
        if (N8N_WEBHOOK_URL) {
          try {
            console.log('=== FETCHING LEAD EMAIL FROM AIRTABLE ===');
            const leadEmail = leadRecord.fields['Email'] as string || '';
            const leadName = structuredData.caller_name || leadRecord.fields['Name'] as string || 'there';
            const companyName = structuredData.company_name || leadRecord.fields['Company'] as string || '';
            console.log('Lead email from Airtable:', leadEmail || 'NOT FOUND');

            if (leadEmail) {
              console.log('=== SENDING MEETING EMAIL VIA N8N ===');
              const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: leadEmail,
                  leadName,
                  companyName,
                  meetingLink: calendlyLink,
                  scheduledTime,
                  leadId,
                }),
              });
              if (n8nResponse.ok) {
                console.log('n8n webhook SUCCESS - meeting email triggered');
              } else {
                console.error('n8n webhook failed:', n8nResponse.status);
              }
            } else {
              console.log('Skipping meeting email - no email found for lead in Airtable');
            }
          } catch (n8nError) {
            console.error('Error sending meeting email:', n8nError);
          }
        } else {
          console.log('N8N_MEETING_EMAIL_WEBHOOK_URL not configured');
        }
      } else {
        console.log('Could not generate Calendly link — check CALENDLY_API_KEY');
      }
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
