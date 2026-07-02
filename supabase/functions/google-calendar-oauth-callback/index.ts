import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateRaw = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const appOrigin = req.headers.get("origin") || req.headers.get("referer") || "";

  const respondRedirect = (target: string) => new Response(null, { status: 302, headers: { Location: target } });

  try {
    if (error) throw new Error(`Google returned: ${error}`);
    if (!code || !stateRaw) throw new Error("Missing code or state");

    // Verify HMAC-signed state to prevent uid spoofing and open redirects.
    const outer = JSON.parse(atob(stateRaw)) as { p: string; s: string };
    if (!outer?.p || !outer?.s) throw new Error("Invalid state");
    const payloadJson = atob(outer.p);
    const enc = new TextEncoder();
    const hmacKey = await crypto.subtle.importKey(
      "raw",
      enc.encode(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const sigBytes = Uint8Array.from(atob(outer.s), (c) => c.charCodeAt(0));
    const ok = await crypto.subtle.verify("HMAC", hmacKey, sigBytes, enc.encode(payloadJson));
    if (!ok) throw new Error("State signature mismatch");
    const state = JSON.parse(payloadJson) as { uid: string; redirectTo?: string; ts?: number };
    // Expire state after 10 minutes.
    if (!state.ts || Date.now() - state.ts > 10 * 60 * 1000) throw new Error("State expired");
    // Enforce same-site redirect: only relative paths starting with "/".
    const safeRedirect = typeof state.redirectTo === "string" && state.redirectTo.startsWith("/")
      ? state.redirectTo
      : "";
    const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET");
    if (!clientId || !clientSecret) throw new Error("Google OAuth not configured");

    const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/google-calendar-oauth-callback`;

    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(`Token exchange failed: ${JSON.stringify(tokenJson)}`);

    const accessToken = tokenJson.access_token as string;
    const refreshToken = tokenJson.refresh_token as string | undefined;
    const expiresIn = tokenJson.expires_in as number;
    const scope = tokenJson.scope as string;

    // Get user info
    const infoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const info = await infoRes.json();
    const googleEmail = info.email as string;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const expiresAt = new Date(Date.now() + (expiresIn - 60) * 1000).toISOString();

    // Upsert connection (preserve refresh_token if Google didn't send one this round)
    const { data: existing } = await supabase
      .from("google_calendar_connections")
      .select("refresh_token, selected_calendar_id, reminder_minutes")
      .eq("user_id", state.uid)
      .maybeSingle();

    const finalRefresh = refreshToken || existing?.refresh_token;
    if (!finalRefresh) throw new Error("No refresh token available — please reconnect with consent");

    const payload = {
      user_id: state.uid,
      google_email: googleEmail,
      access_token: accessToken,
      refresh_token: finalRefresh,
      token_expires_at: expiresAt,
      scope,
      selected_calendar_id: existing?.selected_calendar_id || "primary",
      reminder_minutes: existing?.reminder_minutes ?? 15,
    };

    const { error: upErr } = await supabase
      .from("google_calendar_connections")
      .upsert(payload, { onConflict: "user_id" });
    if (upErr) throw new Error(upErr.message);

    const target = safeRedirect || "/profile?tab=calendar&connected=1";
    return respondRedirect(target);
  } catch (e) {
    console.error("google-calendar-oauth-callback error", e);
    return respondRedirect("/profile?tab=calendar&error=oauth_failed");
  }
});