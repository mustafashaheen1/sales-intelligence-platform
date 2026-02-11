import { VapiCall, VapiCallStatus } from "@/types";

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
  scheduledAt?: string;
}): Promise<{ callId: string; status: string }> {
  const assistantId = params.assistantId || process.env.VAPI_ASSISTANT_ID;
  if (!assistantId) {
    throw new Error("Vapi Assistant ID not configured");
  }

  const response = await fetch(`${VAPI_API_BASE}/call`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      assistantId,
      customer: {
        number: params.phoneNumber,
        name: params.leadName,
      },
      assistantOverrides: {
        firstMessage: `Hi, this is Sarah from the sales team. Am I speaking with ${params.leadName}${params.leadCompany ? ` from ${params.leadCompany}` : ""}?`,
      },
    }),
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

export function parseVapiWebhook(body: any): {
  callId: string;
  status: VapiCallStatus;
  duration?: number;
  summary?: string;
  outcome?: string;
  transcript?: string;
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
