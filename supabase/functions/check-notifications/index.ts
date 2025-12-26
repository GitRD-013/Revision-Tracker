
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { SignJWT, importPKCS8 } from "https://deno.land/x/jose@v4.14.4/index.ts"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const FIREBASE_SERVICE_ACCOUNT = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON') ?? '{}';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface Topic {
    id: string;
    title: string;
    revisions: { status: string; date: string }[];
}

interface Settings {
    notifications: {
        enabled: boolean;
        reminderTime: string;
    }
}

serve(async (req) => {
    let serviceAccount;
    try {
        serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
        return new Response(JSON.stringify({ error: "Invalid Service Account JSON" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    const projectId = serviceAccount.project_id;

    const { data: subs, error: subError } = await supabase
        .from('push_subscriptions')
        .select('user_id, fcm_token');

    if (subError || !subs) {
        return new Response(JSON.stringify({ error: subError }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    const userTokens: Record<string, string[]> = {};
    subs.forEach(s => {
        if (!userTokens[s.user_id]) userTokens[s.user_id] = [];
        userTokens[s.user_id].push(s.fcm_token);
    });

    const userIds = Object.keys(userTokens);
    if (userIds.length === 0) return new Response(JSON.stringify({ sent: 0, message: "No subscribers" }), { status: 200, headers: { "Content-Type": "application/json" } });

    const { data: userData, error: dataError } = await supabase
        .from('user_data')
        .select('user_id, topics, settings')
        .in('user_id', userIds);

    if (dataError) return new Response(JSON.stringify({ error: dataError }), { status: 500, headers: { "Content-Type": "application/json" } });

    let sentCount = 0;
    let accessToken = null;

    try {
        const alg = 'RS256'
        const pkcs8 = await importPKCS8(serviceAccount.private_key, alg)

        const jwt = await new SignJWT({
            iss: serviceAccount.client_email,
            scope: 'https://www.googleapis.com/auth/firebase.messaging',
            aud: 'https://oauth2.googleapis.com/token'
        })
            .setProtectedHeader({ alg })
            .setIssuedAt()
            .setExpirationTime('1h')
            .sign(pkcs8)

        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                assertion: jwt
            })
        });
        const tokenData = await tokenRes.json();
        accessToken = tokenData.access_token;

    } catch (e: any) {
        return new Response(JSON.stringify({ error: "Auth Error: " + e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    if (!accessToken) {
        return new Response(JSON.stringify({ error: "Failed to obtain access token" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    for (const user of userData) {
        const settings = user.settings as Settings;
        const topics = user.topics as Topic[];

        if (settings?.notifications?.enabled === false) continue;

        const today = new Date().toISOString().split('T')[0];
        const pending = topics.filter(t => {
            return t.revisions.some(r => r.status === 'PENDING' && r.date <= today);
        });

        if (pending.length > 0) {
            const topicNames = pending.map(t => t.title).slice(0, 3).join(', ');
            const moreCount = pending.length - 3;

            let body = "Revise " + topicNames + ".";
            if (moreCount > 0) {
                body = "Revise " + topicNames + " and " + moreCount + " more.";
            }

            const tokens = userTokens[user.user_id];

            for (const token of tokens) {
                try {
                    await fetch('https://fcm.googleapis.com/v1/projects/' + projectId + '/messages:send', {
                        method: 'POST',
                        headers: {
                            'Authorization': 'Bearer ' + accessToken,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            message: {
                                token: token,
                                data: {
                                    title: "Revision Reminder",
                                    body: body,
                                    url: "/",
                                    topicIds: pending.map(p => p.id).join(',')
                                }
                            }
                        })
                    });
                    sentCount++;
                } catch (e) {
                    console.error("Send failed", e);
                }
            }
        }
    }

    return new Response(JSON.stringify({ sent: sentCount }), { headers: { "Content-Type": "application/json" } });
});
