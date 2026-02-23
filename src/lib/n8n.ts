export type N8nTriggerType = "hot_lead" | "follow_up" | "cold_nurture" | "call_completed";

// Map trigger types to their corresponding environment variable names
const WEBHOOK_ENV_MAP: Record<N8nTriggerType, string> = {
  hot_lead: "N8N_HOT_LEAD_WEBHOOK",
  follow_up: "N8N_HOT_LEAD_WEBHOOK",
  cold_nurture: "N8N_COLD_LEAD_WEBHOOK",
  call_completed: "N8N_CALL_COMPLETED_WEBHOOK",
};

interface N8nPayload {
  triggerType: N8nTriggerType;
  timestamp: string;
  data: Record<string, any>;
}

export async function triggerN8nWorkflow(
  triggerType: N8nTriggerType,
  data: Record<string, any>
): Promise<{ success: boolean; message: string }> {
  const envVar = WEBHOOK_ENV_MAP[triggerType];
  const webhookUrl = process.env[envVar];
  if (!webhookUrl) {
    console.warn(`n8n webhook URL not configured for ${triggerType} (expected env: ${envVar})`);
    return { success: false, message: `n8n webhook URL not configured for ${triggerType}` };
  }

  const payload: N8nPayload = {
    triggerType,
    timestamp: new Date().toISOString(),
    data,
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (process.env.N8N_WEBHOOK_SECRET) {
    headers["X-Webhook-Secret"] = process.env.N8N_WEBHOOK_SECRET;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, message: `n8n webhook error: ${error}` };
    }

    return { success: true, message: "Workflow triggered successfully" };
  } catch (error) {
    return {
      success: false,
      message: `Failed to trigger n8n workflow: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

export function verifyN8nWebhook(secret: string | null): boolean {
  const expectedSecret = process.env.N8N_WEBHOOK_SECRET;
  if (!expectedSecret) return true;
  return secret === expectedSecret;
}
