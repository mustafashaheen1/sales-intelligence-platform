export type N8nTriggerType = "hot_lead" | "follow_up" | "cold_nurture" | "call_completed";

interface N8nPayload {
  triggerType: N8nTriggerType;
  timestamp: string;
  data: Record<string, any>;
}

export async function triggerN8nWorkflow(
  triggerType: N8nTriggerType,
  data: Record<string, any>
): Promise<{ success: boolean; message: string }> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("n8n webhook URL not configured");
    return { success: false, message: "n8n webhook URL not configured" };
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
