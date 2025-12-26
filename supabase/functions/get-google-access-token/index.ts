
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-firebase-token, x-firebase-api-key',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 1. Get Token and Key
        const idToken = req.headers.get('x-firebase-token');
        if (!idToken) throw new Error('Missing x-firebase-token header');

        const apiKey = req.headers.get('x-firebase-api-key');
        if (!apiKey) throw new Error('Missing x-firebase-api-key header');

        const verifyRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: idToken })
        });

        const verifyData = await verifyRes.json();

        if (verifyData.error) {
            throw new Error(`Invalid Token: ${verifyData.error.message}`);
        }

        if (!verifyData.users || verifyData.users.length === 0) {
            throw new Error("Token valid but no user found.");
        }

        // The Firebase UID is in the 'localId' field
        const user_id = verifyData.users[0].localId;
        if (!user_id) throw new Error("Token missing 'localId' (User ID)");

        // 3. Get Refresh Token from DB
        const supabaseUrl = Deno.env.get('PROJECT_URL') || Deno.env.get('SUPABASE_URL') || '';
        const supabaseAdmin = createClient(
            supabaseUrl,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { data, error: dbError } = await supabaseAdmin
            .from('user_tokens')
            .select('refresh_token')
            .eq('user_id', user_id)
            .single();

        if (dbError || !data?.refresh_token) {
            throw new Error("No Google Connection found for this user.");
        }

        // 4. Get New Access Token from Google
        const client_id = Deno.env.get('GOOGLE_CLIENT_ID');
        const client_secret = Deno.env.get('GOOGLE_CLIENT_SECRET');

        const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: client_id!,
                client_secret: client_secret!,
                refresh_token: data.refresh_token,
                grant_type: 'refresh_token',
            }),
        });

        const refreshData = await refreshRes.json();

        if (refreshData.error) {
            // If the refresh token is invalid (revoked), we should probably delete it from DB?
            // For now, just return error.
            throw new Error(`Google Refresh Error: ${refreshData.error_description}`);
        }

        // 5. Return the new Access Token
        return new Response(JSON.stringify({
            access_token: refreshData.access_token,
            expires_in: refreshData.expires_in
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 200, // Return 200 so client gets the JSON body
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
