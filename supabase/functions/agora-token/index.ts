import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { RtcTokenBuilder, RtcRole } from 'npm:agora-token@2.0.5'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token)
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const userId = claimsData.claims.sub as string

    const body = await req.json().catch(() => ({}))
    const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : null
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'sessionId required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Authorize: must be the tutor of the session OR a confirmed booking holder
    const { data: sessionRow } = await supabase
      .from('sessions')
      .select('id, tutor_id')
      .eq('id', sessionId)
      .maybeSingle()

    let authorized = false
    if (sessionRow?.tutor_id === userId) {
      authorized = true
    } else {
      const { data: booking } = await supabase
        .from('bookings')
        .select('id')
        .eq('user_id', userId)
        .eq('session_id', sessionId)
        .eq('status', 'confirmed')
        .maybeSingle()
      authorized = !!booking
    }

    if (!authorized) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const appId = Deno.env.get('AGORA_APP_ID')!
    const appCertificate = Deno.env.get('AGORA_APP_CERTIFICATE')!
    const channelName = `session-${sessionId}`
    // Numeric uid derived from user uuid (deterministic, fits in uint32)
    const uid = Math.abs(
      Array.from(userId).reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0)
    ) % 1_000_000_000

    const expireSeconds = 3600
    const currentTs = Math.floor(Date.now() / 1000)
    const privilegeExpireTs = currentTs + expireSeconds

    const rtcToken = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      RtcRole.PUBLISHER,
      privilegeExpireTs,
      privilegeExpireTs,
    )

    return new Response(
      JSON.stringify({ token: rtcToken, appId, channelName, uid, expiresAt: privilegeExpireTs }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (e) {
    console.error('agora-token error', e)
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})