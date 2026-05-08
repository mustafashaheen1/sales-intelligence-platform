import { VapiCall, VapiCallStatus, Lead, Company } from "@/types";
import { formatPhoneForVapi } from "@/lib/utils";
import { buildCallContext, buildFirstMessage, generateSystemPrompt } from "./call-context";
import { getLeads } from "./airtable";

const VAPI_API_BASE = "https://api.vapi.ai";

function getHeaders() {
  if (!process.env.VAPI_API_KEY) {
    throw new Error("Vapi API key not configured");
  }
  return {
    Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
    "Content-Type": "application/json",
  };
}

export async function scheduleVapiCall(params: {
  phoneNumber: string;
  assistantId?: string;
  leadName: string;
  leadCompany?: string;
  leadId: string;
  lead?: Lead;
  company?: Company | null;
  availableSlots?: string;
  schedulingLink?: string;
  isInbound?: boolean;
}): Promise<{ callId: string; status: string }> {
  const assistantId = params.assistantId || process.env.VAPI_ASSISTANT_ID;
  if (!assistantId) {
    throw new Error("Vapi Assistant ID not configured");
  }

  const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;
  if (!phoneNumberId) {
    throw new Error("Vapi Phone Number ID not configured");
  }

  let systemPrompt = "";
  const context = params.lead
    ? buildCallContext(params.lead, params.company, params.availableSlots, params.schedulingLink)
    : null;

  const firstMessage = params.lead && context
    ? buildFirstMessage(params.lead, context)
    : `Hi, is this ${params.leadName}${params.leadCompany ? ` from ${params.leadCompany}` : ""}?`;

  if (params.lead && context) {
    systemPrompt = generateSystemPrompt(params.lead, context);
  }

  const requestBody: any = {
    phoneNumberId,
    assistantId,
    customer: {
      number: formatPhoneForVapi(params.phoneNumber),
    },
    metadata: {
      leadId: params.leadId,
      callType: params.isInbound ? "inbound" : "outbound",
    },
    assistantOverrides: {
      firstMessage,
    },
  };

  if (systemPrompt) {
    const modelProvider = process.env.VAPI_MODEL_PROVIDER || "openai";
    const modelName = process.env.VAPI_MODEL_NAME || "gpt-4o";
    requestBody.assistantOverrides.model = {
      provider: modelProvider,
      model: modelName,
      messages: [{ role: "system", content: systemPrompt }],
    };
  }

  const response = await fetch(`${VAPI_API_BASE}/call`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Vapi API error: ${error}`);
  }

  const data = await response.json();
  return {
    callId: data.id,
    status: data.status,
  };
}

export async function handleInboundCall(customerPhone: string): Promise<Lead | null> {
  const { leads } = await getLeads({
    filterByFormula: `{Phone} = "${customerPhone.replace(/\D/g, "").slice(-10)}"`,
    maxRecords: 1,
  });

  return leads[0] || null;
}

export function parseVapiWebhook(body: any): {
  callId: string;
  status: VapiCallStatus;
  duration?: number;
  summary?: string;
  outcome?: string;
  transcript?: string;
  customerPhone?: string;
  structuredData?: Record<string, any>;
} {
  const message = body.message || body;

  let status: VapiCallStatus = "Completed";
  if (message.status === "no-answer" || message.endedReason === "no-answer") {
    status = "No Answer";
  } else if (message.status === "busy" || message.endedReason === "busy") {
    status = "Callback Requested";
  }

  return {
    callId: message.call?.id || message.id || "",
    status,
    duration: message.call?.duration || message.duration,
    summary: message.analysis?.summary || message.summary,
    outcome: message.analysis?.successEvaluation || "unknown",
    transcript: message.transcript,
    customerPhone: message.customer?.number || message.call?.customer?.number,
    structuredData: message.analysis?.structuredData,
  };
}

export async function getVapiCalls(): Promise<any[]> {
  const response = await fetch(`${VAPI_API_BASE}/call`, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Vapi calls");
  }

  return response.json();
}
