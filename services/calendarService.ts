
// Wrapper for Google Calendar API
// Uses Supabase Edge Functions for secure persistent auth

import { supabase } from './supabase';
import { auth } from '../firebase';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

let gapiInited = false;

export const initGapi = (_clientId: string, onInit: (success: boolean) => void) => {
  if (gapiInited && window.gapi) {
    onInit(true);
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://apis.google.com/js/api.js';
  script.onload = () => {
    window.gapi.load('client', async () => {
      try {
        await window.gapi.client.init({
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
        });
        gapiInited = true;
        onInit(true);
      } catch (err) {
        console.error("GAPI Init Error:", err);
        onInit(false);
      }
    });
  };
  script.onerror = () => onInit(false);
  document.body.appendChild(script);
};

export const handleAuthClick = async (): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error("You must be logged in to connect Google Calendar.");

  const token = await user.getIdToken();

  // Call Supabase Function to get Auth URL
  const { data, error } = await supabase.functions.invoke('get-google-auth-url', {
    body: {
      user_id: user.uid,
      redirect_to: window.location.href
    },
    headers: {
      'x-firebase-token': token
    }
  });

  if (error) {
    console.error("Supabase Function Error Details:", error);
    throw new Error(`Edge Function Error: ${error.message || JSON.stringify(error)}`);
  }
  if (!data?.url) throw new Error("Failed to get auth URL: No URL in response");

  // Redirect user to Google
  window.location.href = data.url;
};

// Check if we have a valid token in GAPI or can get one from Backend
export const ensureToken = async (): Promise<boolean> => {
  // 1. If we already have a token in memory, use it
  if (window.gapi?.client?.getToken()) {
    return true;
  }

  // 2. Try to fetch a fresh token from Backend (using Refresh Token)
  try {
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) return false;

    console.log("[CalendarService] Fetching fresh access token...");
    const idToken = await user.getIdToken(true);

    const PROJECT_URL = import.meta.env.VITE_SUPABASE_URL || 'https://djexbggtesnkbdwtuybr.supabase.co';
    const response = await fetch(`${PROJECT_URL}/functions/v1/get-google-access-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
        'x-firebase-token': idToken,
        'x-firebase-api-key': import.meta.env.VITE_FIREBASE_API_KEY
      },
      body: JSON.stringify({ user_id: user.uid })
    });

    const data = await response.json();

    if (response.status === 401 || response.status === 403 || data.error?.includes('refresh_token')) {
      signOut();
      throw new Error("Google Calendar disconnected. Please connect again.");
    }

    if (!response.ok) {
      console.warn("[CalendarService] Token fetch failed:", data.error);
      throw new Error(data.error || "Failed to retrieve access token.");
    }

    if (data?.access_token) {
      window.gapi.client.setToken({
        access_token: data.access_token,
        expires_in: data.expires_in || 3600
      });
      console.log("[CalendarService] Token refreshed successfully.");

      // Self-healing: If email is missing in settings, try to fetch it now
      const settingsStr = localStorage.getItem('diggiclass_settings');
      if (settingsStr) {
        const settings = JSON.parse(settingsStr);
        if (settings.googleCalendarConnected && !settings.googleAccountEmail) {
          await fetchUserEmail(data.access_token);
        }
      }

      return true;
    } else {
      throw new Error("Server returned no access token.");
    }

  } catch (err: any) {
    console.error("[CalendarService] ensureToken error:", err);
    throw err;
  }
};

export const checkIsSignedIn = () => {
  return !!window.gapi?.client?.getToken();
};

export const signOut = () => {
  window.gapi?.client?.setToken(null);
  // Optional: Call backend to delete refresh token if we want "true" disconnect
};

export const fetchUserEmail = async (accessToken: string): Promise<string | null> => {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) {
      console.warn("User info fetch failed:", res.status, res.statusText);
      return null;
    }
    const data = await res.json();
    return data.email || null;
  } catch (err) {
    console.error("Error fetching user email:", err);
    return null;
  }
};


export const GOOGLE_CALENDAR_COLORS = [
  { id: '1', name: 'Lavender', hex: '#7986cb' },
  { id: '2', name: 'Sage', hex: '#33b679' },
  { id: '3', name: 'Grape', hex: '#8e24aa' },
  { id: '4', name: 'Flamingo', hex: '#e67c73' },
  { id: '5', name: 'Banana', hex: '#f6c026' },
  { id: '6', name: 'Tangerine', hex: '#f5511d' },
  { id: '7', name: 'Peacock', hex: '#039be5' },
  { id: '8', name: 'Graphite', hex: '#616161' },
  { id: '9', name: 'Blueberry', hex: '#3f51b5' },
  { id: '10', name: 'Basil', hex: '#0b8043' },
  { id: '11', name: 'Tomato', hex: '#d50000' },
];

export const findEventByTopicData = async (
  topicId: string,
  _revisionDate: string,
  timeMin: string,
  timeMax: string
): Promise<any | null> => {
  try {
    const response = await window.gapi.client.calendar.events.list({
      'calendarId': 'primary',
      'timeMin': timeMin,
      'timeMax': timeMax,
      'singleEvents': true,
      'privateExtendedProperty': `diggiTopicId=${topicId}`,
    });

    const events = response.result.items;
    if (events && events.length > 0) {
      return events[0];
    }
    return null;
  } catch (e) {
    console.error("Error searching events", e);
    return null;
  }
}

export const addEventToCalendar = async (
  title: string,
  date: string,
  subject?: string,
  time: string = '09:00',
  colorId: string = '9',
  topicId?: string,
  revisionId?: string
): Promise<string | null> => {
  try {
    // Ensure we have a token (will fetch if needed)
    if (!(await ensureToken())) {
      console.warn("[CalendarService] No valid token.");
      return null;
    }

    const startDateTime = new Date(`${date}T${time}:00`).toISOString();
    const [hours] = time.split(':').map(Number);
    const endDate = new Date(`${date}T${time}:00`);
    endDate.setHours(hours + 1);
    const endDateTime = endDate.toISOString();

    const summaryBase = `Revise: ${title}`;
    const summary = subject ? `${summaryBase} [${subject}]` : summaryBase;

    // Idempotency Check
    if (topicId) {
      const dayStart = new Date(`${date}T00:00:00`).toISOString();
      const dayEnd = new Date(`${date}T23:59:59`).toISOString();

      // 1. Strict Check (Metadata)
      const existingEvent = await findEventByTopicData(topicId, date, dayStart, dayEnd);
      if (existingEvent) {
        console.log(`[CalendarService] Skipped duplicate (ID Match): ${summary}`);
        return existingEvent.id;
      }

      // 2. Fuzzy Check (Title + Date) - Protection against manual/legacy duplicates
      // We list all events for this day to check for matching titles
      try {
        // Small batch for just this day
        // Filter to ensure we only look at this specific day (listEvents uses timeMin, so future events could be included)
        // But since we want to check THIS day, we should probably stick to listEvents logic or use a specific range fetch.
        // Let's actually use a constrained search logic similar to findEventByTopicData but without the private prop
        const fuzzyResponse = await window.gapi.client.calendar.events.list({
          'calendarId': 'primary',
          'timeMin': dayStart,
          'timeMax': dayEnd,
          'singleEvents': true,
        });
        const possibleDupes = fuzzyResponse.result.items || [];

        const fuzzyMatch = possibleDupes.find((ev: any) => {
          const evSummary = (ev.summary || '').trim();
          return evSummary === summary ||
            evSummary === summaryBase ||
            evSummary.startsWith(`${summaryBase} [`);
        });

        if (fuzzyMatch) {
          console.log(`[CalendarService] Skipped duplicate (Fuzzy Match): ${summary}`);
          // Opt: We could technically "adopt" this event by patching it with our ID?
          // For now, just returning its ID is safe enough to link it locally.
          return fuzzyMatch.id;
        }

      } catch (err) {
        console.warn("Fuzzy check failed, proceeding...", err);
      }
    }

    const event: any = {
      summary: summary,
      description: 'Auto-scheduled by DiggiClass',
      start: { dateTime: startDateTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      end: { dateTime: endDateTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      colorId: colorId,
      extendedProperties: {}
    };

    if (topicId) {
      event.extendedProperties.private = {
        diggiTopicId: topicId,
        diggiRevisionId: revisionId || 'unknown'
      };
    }

    const request = await window.gapi.client.calendar.events.insert({
      'calendarId': 'primary',
      'resource': event,
    });

    return request.result.id;
  } catch (err) {
    console.error("Error adding event", err);
    return null;
  }
};

export const updateEvent = async (
  eventId: string,
  title: string,
  date: string,
  subject?: string,
  time: string = '09:00',
  colorId?: string
): Promise<boolean> => {
  try {
    if (!(await ensureToken())) return false;

    const startDateTime = new Date(`${date}T${time}:00`).toISOString();
    const [hours] = time.split(':').map(Number);
    const endDate = new Date(`${date}T${time}:00`);
    endDate.setHours(hours + 1);
    const endDateTime = endDate.toISOString();

    const summaryBase = `Revise: ${title}`;
    const summary = subject ? `${summaryBase} [${subject}]` : summaryBase;

    const event: any = {
      summary: summary,
      start: { dateTime: startDateTime },
      end: { dateTime: endDateTime },
    };

    if (colorId) {
      event.colorId = colorId;
    }

    await window.gapi.client.calendar.events.patch({
      'calendarId': 'primary',
      'eventId': eventId,
      'resource': event,
    });

    return true;
  } catch (err) {
    console.error(`[CalendarService] Error updating event ${eventId}`, err);
    return false;
  }
};

export const deleteEventFromCalendar = async (eventId: string): Promise<boolean> => {
  try {
    if (!(await ensureToken())) return false;

    await window.gapi.client.calendar.events.delete({
      'calendarId': 'primary',
      'eventId': eventId
    });
    return true;
  } catch (err) {
    console.error(`[CalendarService] Error deleting event ${eventId}`, err);
    return false;
  }
};

export const listEvents = async (timeMin?: string, maxResults: number = 200) => {
  try {
    if (!(await ensureToken())) return [];

    const response = await window.gapi.client.calendar.events.list({
      'calendarId': 'primary',
      'timeMin': timeMin || (new Date()).toISOString(),
      'showDeleted': false,
      'singleEvents': true,
      'maxResults': maxResults,
      'orderBy': 'startTime',
    });
    return response.result.items;
  } catch (err) {
    console.error("Error listing events", err);
    return [];
  }
};

/**
 * Robust Batch Sync
 * - Lists all future events to minimize API calls.
 * - Matches by 'extendedProperties.diggiTopicId' OR 'summary' + 'date' (fuzzy fallback).
 * - Updates local topics with googleEventId if found.
 * - Creates new events if missing.
 */
export const batchSyncRevisions = async (topics: any[]): Promise<{ updatedTopics: any[], syncedCount: number }> => {
  if (!(await ensureToken())) return { updatedTopics: topics, syncedCount: 0 };

  console.log("[CalendarService] Starting Batch Sync...");
  let syncedCount = 0;
  const updatedTopics = JSON.parse(JSON.stringify(topics)); // Deep copy to avoid mutation issues

  // 1. Get Range
  const allDates = updatedTopics.flatMap((t: any) => t.revisions.map((r: any) => r.date));
  if (allDates.length === 0) return { updatedTopics, syncedCount: 0 };

  const minDate = allDates.sort()[0];
  const existingEvents = await listEvents(new Date(minDate).toISOString(), 2500); // Fetch plenty
  console.log(`[CalendarService] Fetched ${existingEvents.length} existing events for matching.`);

  for (const topic of updatedTopics) {
    for (const rev of topic.revisions) {
      if (rev.status === 'CANCELLED') continue;

      // Target Identifier
      const summaryBase = `Revise: ${topic.title}`;
      const summaryWithSubject = `Revise: ${topic.title} [${topic.subject}]`; // We prefer this now

      // Match Logic
      let match = existingEvents.find((ev: any) => {
        // 1. Strong Match: Extended Property
        if (ev.extendedProperties?.private?.diggiRevisionId === rev.id) return true;
        return false;
      });

      if (!match) {
        // 2. Fuzzy Match: Date + Title
        match = existingEvents.find((ev: any) => {
          const evDate = ev.start.dateTime || ev.start.date;
          if (!evDate.startsWith(rev.date)) return false;

          // Check title variations
          const evSummary = ev.summary || '';
          return evSummary === summaryBase || evSummary.startsWith(`${summaryBase} [`) || evSummary === summaryWithSubject;
        });
      }

      if (match) {
        // Linked!
        if (rev.googleEventId !== match.id) {
          console.log(`[Sync] Resumed link for ${topic.title} (${rev.date}) -> ${match.id}`);
          rev.googleEventId = match.id;
          syncedCount++;
        }
      } else {
        // Not found -> Create
        // Only create if we expected it to be there (pending) OR if it never existed
        if (!rev.googleEventId) {
          console.log(`[Sync] Creating missing event for ${topic.title} (${rev.date})`);
          const newId = await addEventToCalendar(
            topic.title,
            rev.date,
            topic.subject,
            undefined, // time
            undefined, // color
            topic.id,
            rev.id
          );
          if (newId) {
            rev.googleEventId = newId;
            syncedCount++;
          }
        }
      }
    }
  }

  return { updatedTopics, syncedCount };
};