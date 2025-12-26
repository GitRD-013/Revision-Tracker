
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verify } from "https://deno.land/x/djwt@v2.8/mod.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const url = new URL(req.url);
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        const error = url.searchParams.get('error');

        if (error) throw new Error(`Google Auth Error: ${error}`);
        if (!code) throw new Error("Missing auth code");
        if (!state) throw new Error("Missing state parameter");

        // 1. Verify State (JWT)
        const jwtSecret = Deno.env.get('JWT_SECRET') || 'super-secret-fallback';
        const key = await crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(jwtSecret),
            { name: "HMAC", hash: "SHA-512" },
            false,
            ["verify"]
        );

        const payload = await verify(state, key);
        const { user_id, redirect_to } = payload;

        if (!user_id) throw new Error("Invalid state: missing user_id");

        // 2. Exchange Code for Tokens
        const client_id = Deno.env.get('GOOGLE_CLIENT_ID');
        const client_secret = Deno.env.get('GOOGLE_CLIENT_SECRET');
        const supabaseUrl = Deno.env.get('PROJECT_URL') || Deno.env.get('SUPABASE_URL');
        if (!supabaseUrl) throw new Error("Missing SUPABASE_URL");

        const redirect_uri = `${supabaseUrl}/functions/v1/google-auth-callback`;

        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: client_id!,
                client_secret: client_secret!,
                redirect_uri,
                grant_type: 'authorization_code',
            }),
        });

        const tokens = await tokenResponse.json();
        if (tokens.error) throw new Error(`Token Exchange Error: ${tokens.error_description}`);

        // 3. Store Refresh Token in Supabase
        // We use the SERVICE_ROLE key because we are writing on behalf of the user
        // and our table might be protected or we just want to bypass RLS for this system operation.
        const supabaseAdmin = createClient(
            Deno.env.get('PROJECT_URL') || Deno.env.get('SUPABASE_URL') || '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Fetch User Email from ID Object (JWT)
        let userEmail = 'Unknown';
        if (tokens.id_token) {
            try {
                // Determine the part to decode (header.payload.signature)
                const parts = tokens.id_token.split('.');
                if (parts.length === 3) {
                    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
                    if (payload.email) userEmail = payload.email;
                }
            } catch (e) {
                console.error("Failed to parse id_token for email:", e);
            }
        }

        // Only update if we got a refresh token, OR if we just want to update the email
        // Logic: Try to get existing token row to preserve refresh_token if not provided now?
        // Actually, if we are here, we just connected.

        const upsertData: any = {
            user_id,
            email: userEmail,
            updated_at: new Date().toISOString(),
        };

        if (tokens.refresh_token) {
            upsertData.refresh_token = tokens.refresh_token;
        }

        // Upsert
        const { error: dbError } = await supabaseAdmin
            .from('user_tokens')
            .upsert(upsertData, { onConflict: 'user_id' }); // Ensure we update by user_id

        if (dbError) throw new Error(`DB Error: ${dbError.message}`);

        // 4. Redirect Back to App
        // We append query params so the app knows it succeeded
        const appRedirect = new URL(redirect_to as string);
        appRedirect.searchParams.set('google_connected', 'true');
        if (userEmail !== 'Unknown') {
            appRedirect.searchParams.set('google_email', userEmail);
        }

        return Response.redirect(appRedirect.toString(), 302);

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
