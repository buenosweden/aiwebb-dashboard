import type { Payload } from "./payload";

/**
 * Skicka en payload till WordPress publish-endpoint.
 *
 * Det här är samma endpoint som publish-test.js från zip-filen anropade.
 * När ni har flera kunder kommer det finnas flera WP-subsites, så
 * vi tar baseUrl och apiKey som argument istället för att hårdkoda.
 *
 * Idag: bara tennisgrus.aiwebb.se. Imorgon: vi slår upp rätt subsite
 * per inloggad kund (sparat i Supabase).
 */

export interface PublishResult {
  success: boolean;
  page_id?: number;
  url?: string;
  edit_url?: string;
  action?: "created" | "updated";
  sections_built?: number;
  error?: string;
  errors?: string[];
}

export async function publishToWordPress(
  payload: Payload,
  options: {
    baseUrl?: string;
    apiKey?: string;
  } = {}
): Promise<PublishResult> {
  const baseUrl = options.baseUrl ?? process.env.AIWEBB_WP_BASE_URL;
  const apiKey = options.apiKey ?? process.env.AIWEBB_WP_API_KEY;

  if (!baseUrl || !apiKey) {
    return {
      success: false,
      error: "missing_config",
    };
  }

  try {
    const response = await fetch(`${baseUrl}/wp-json/aiwebb/v1/publish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error ?? "publish_failed",
        errors: data.errors,
      };
    }

    return data as PublishResult;
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "network_error",
    };
  }
}
