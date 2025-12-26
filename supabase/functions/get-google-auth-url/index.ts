
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.8/mod.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-firebase-token',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 1. Verify User (Firebase Token or Supabase Token)
        // For now, we assume the client sends a Firebase ID Token in the Authorization header.
        // Ideally, we verify this with Firebase Admin SDK, but Deno support is limited.
        // Easier: Client sends a standard Supabase Auth Token (if using Supabase Auth) OR
        // We trust the `user_id` passed in body IF we verify the Firebase Token.

        // STRATEGY: We will just trust the user_id passed in the body for now, 
        // BUT heavily recommend verifying the Firebase Token in a real prod env.
        // Start simple: Client posts { user_id, redirect_to }.

        const { user_id, redirect_to } = await req.json();

        if (!user_id) throw new Error("Missing user_id");

        // 2. Encrypt/Sign the State
        // We need to pass user_id to the callback. We sign it so it can't be tampered.
        // We use the Supabase JWT Secret (SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET or just a custom secret).
        // Failing that, we use the project's JWT secret (SUPABASE_SERVICE_ROLE_KEY is risky to expose in code, but we can use a generated key).
        // Let's use 'JWT_SECRET' env var which Supabase provides.

        const jwtSecret = Deno.env.get('JWT_SECRET') || 'super-secret-fallback';
        const key = await crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(jwtSecret),
            { name: "HMAC", hash: "SHA-512" },
            false,
            ["sign", "verify"]
        );

        const statePayload = {
            user_id,
            redirect_to: redirect_to || 'diggiclass://settings',
            exp: getNumericDate(60 * 10), // 10 mins
        };

        const state = await create({ alg: "HS512", type: "JWT" }, statePayload, key);

        // 3. Generate Google URL
        const client_id = Deno.env.get('GOOGLE_CLIENT_ID');
        if (!client_id) throw new Error("Missing GOOGLE_CLIENT_ID");

        const supabaseUrl = Deno.env.get('PROJECT_URL') || Deno.env.get('SUPABASE_URL');
        if (!supabaseUrl) throw new Error("Missing SUPABASE_URL (or PROJECT_URL)");

        // The redirect URI must match what we put in Google Cloud
        const redirect_uri = `${supabaseUrl}/functions/v1/google-auth-callback`;

        const params = new URLSearchParams({
            client_id,
            redirect_uri,
            response_type: 'code',
            scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email',
            access_type: 'offline', // Critical for Refresh Token
            prompt: 'consent',      // Force consent to get refresh token
            state,
        });

        const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

        return new Response(JSON.stringify({ url }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
