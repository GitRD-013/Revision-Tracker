// Wrapper for Google Calendar API
// Note: Requires a valid Client ID in settings to function fully.

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}


// Wrapper for Google Calendar API
// Note: Requires a valid Client ID in settings to function fully.

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

let tokenClient: any;
let gapiInited = false;
let gisInited = false;
// Client Secret removed - not needed for Implicit Flow / Token Model

export const initGapi = (clientId: string, onInit: (success: boolean) => void) => {
  const origin = window.location.origin;
  console.log(`[CalendarService] Initializing. Origin: ${origin}, ClientID: ${clientId}`);

  if (!clientId) {
    console.warn("[CalendarService] No Client ID provided.");
    onInit(false);
    return;
  }

  // Check if scripts are already loaded to avoid duplicates
  if (window.gapi) {
    gapiInited = true;
  }
  if (window.google && window.google.accounts) {
    gisInited = true;
  }

  if (gapiInited && gisInited) {
    // Force re-initialize token client if ID changed
    initializeTokenClient(clientId);
    onInit(true);
    return;
  }

  if (!window.gapi) {
    const script1 = document.createElement('script');
    script1.src = 'https://apis.google.com/js/api.js';
    script1.onload = () => {
      window.gapi.load('client', async () => {
        await window.gapi.client.init({
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
        });
        gapiInited = true;
        checkInit(clientId, onInit);
      });
    };
    document.body.appendChild(script1);
  }

  if (!window.google) {
    const script2 = document.createElement('script');
    script2.src = 'https://accounts.google.com/gsi/client';
    script2.onload = () => {
      gisInited = true;
      checkInit(clientId, onInit);
    };
    document.body.appendChild(script2);
  }
};

const checkInit = (clientId: string, cb: (s: boolean) => void) => {
  if (gapiInited && gisInited) {
    initializeTokenClient(clientId);
    cb(true);
  }
};

const initializeTokenClient = (clientId: string) => {
  if (!window.google || !window.google.accounts) {
    console.error("[CalendarService] Google Identity Services script not loaded.");
    return;
  }

  console.log(`[CalendarService] Creating TokenClient with ID: ${clientId}`);

  // Use initTokenClient instead of initCodeClient for Implicit Flow
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: 'https://www.googleapis.com/auth/calendar.events',
    callback: (resp: any) => {
      if (resp.error) {
        console.error("[CalendarService] Auth Error:", resp);
        throw resp;
      }

      if (resp.access_token) {
        console.log("[CalendarService] Access Token received.");

        // Save to GAPI
        // Note: GIS tokens don't auto-set to GAPI client like gapi.auth2 did.
        // We must manually set it.
        window.gapi.client.setToken({
          access_token: resp.access_token,
          // GIS responses don't always include 'expires_in' in the same way, but usually do.
          // We can default to 3599 if missing, or handle it.
          // Implicit flow tokens last 1 hour.
        });

        // "Persistence" - Save strict access token to localStorage to survive reload
        // Security Warning: This effectively makes the token accessible to XSS.
        // For a personal local app, this is acceptable trade-off for UX.
        const expiry = Date.now() + (Number(resp.expires_in || 3599) * 1000);

        localStorage.setItem('google_access_token', resp.access_token);
        localStorage.setItem('google_token_expiry', expiry.toString());

        // Dispatch success event
        const event = new CustomEvent('google-auth-success', {
          detail: {
            access_token: resp.access_token,
            expiry_date: expiry
          }
        });
        window.dispatchEvent(event);
      }
    },
  });


};

export const handleAuthClick = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      console.error("[CalendarService] TokenClient is missing. Was initGapi called?");
      return reject("Google Calendar services not initialized. Please refresh or check settings.");
    }

    console.log(`[CalendarService] Requesting Access Token.`);

    // Check if we need to wait for callback or if requestAccessToken returns promise?
    // requestAccessToken is void. The callback defined in initTokenClient handles the response.
    // So we can't easily resolve THIS promise here without a temporary listener or just resolving immediately
    // and letting the global event handle the UI update.

    // BETTER APPROACH: Wrap the callback or just trigger it.
    // Since initTokenClient takes a callback, we can't await it here easily.
    // However, for the UI "spinner", we might want to know.
    // Let's create a one-time listener for the event we dispatch.

    const onAuthSuccess = () => {
      window.removeEventListener('google-auth-success', onAuthSuccess);
      resolve();
    };
    window.addEventListener('google-auth-success', onAuthSuccess);

    // Prompt the user
    // requestAccessToken({prompt: ''}) acts as "authorize"
    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
};

/* checkIsSignedIn logic updated */
export const checkIsSignedIn = () => {
  // 1. Check GAPI memory
  if (window.gapi?.client?.getToken()) return true;

  // 2. Check Local Storage "Persistence"
  const storedToken = localStorage.getItem('google_access_token');
  const storedExpiry = localStorage.getItem('google_token_expiry');

  if (storedToken && storedExpiry) {
    if (Date.now() < Number(storedExpiry)) {
      // Restore session
      window.gapi?.client?.setToken({ access_token: storedToken });
      return true;
    } else {
      console.log("[CalendarService] Stored token expired.");
      return false; // Token expired
    }
  }

  return false;
};

// Check if token is valid, if not try to restore from storage.
// If storage is expired, user MUST sign in again interactively.
export const ensureToken = async (): Promise<boolean> => {
  if (checkIsSignedIn()) return true;
  return false;
};

// Old helpers removed/simplified



// restoreSession removed as it was for Implicit Flow. 
// We rely on ensureToken with saved credentials now.
export const restoreSession = async (): Promise<boolean> => {
  // Deprecated in favor of ensureToken passed with credentials from App.tsx
  // effectively a no-op or always false to force ensureToken usage.
  return false;
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

/**
 * Finds an event by extended properties (TopicId).
 * Using privateExtendedProperty for internal IDs to avoid user clutter, 
 * but note that they are only visible to this specific API project.
 */
export const findEventByTopicData = async (
  topicId: string,
  _revisionDate: string,
  timeMin: string,
  timeMax: string
): Promise<any | null> => {
  try {
    // Filter mainly by time range first to reduce bandwidth
    const response = await window.gapi.client.calendar.events.list({
      'calendarId': 'primary',
      'timeMin': timeMin,
      'timeMax': timeMax,
      'singleEvents': true,
      'privateExtendedProperty': `diggiTopicId=${topicId}`, // Strict filtering by ID
    });

    const events = response.result.items;
    if (events && events.length > 0) {
      // Double check date just in case
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
  time: string = '09:00', // Default 9 AM
  colorId: string = '9',   // Default Blueberry
  topicId?: string,        // New: For deduplication
  revisionId?: string      // New: For deduplication
): Promise<string | null> => {
  try {
    // ensureToken checks strictly for memory validity now.
    // The CALLER should have ensured we are logged in or tried to recover session before calling this.
    // But as a safeguard:
    if (!window.gapi?.client?.getToken()) {
      console.warn("[CalendarService] No token available for addEvent. Call ensureToken first.");
      return null;
    }

    const startDateTime = new Date(`${date}T${time}:00`).toISOString();
    // End time is 1 hour after start time
    const [hours] = time.split(':').map(Number);
    const endDate = new Date(`${date}T${time}:00`);
    endDate.setHours(hours + 1);
    const endDateTime = endDate.toISOString();

    const summaryBase = `Revise: ${title}`;
    const summary = subject ? `${summaryBase} [${subject}]` : summaryBase;

    // 1. Idempotency Check
    if (topicId) {
      // Broaden search range to full day to catch if it exists
      const dayStart = new Date(`${date}T00:00:00`).toISOString();
      const dayEnd = new Date(`${date}T23:59:59`).toISOString();

      // Strategy A: Check by metadata (Preferred)
      const existingEvent = await findEventByTopicData(topicId, date, dayStart, dayEnd);

      if (existingEvent) {
        console.log(`[CalendarService] Skipped duplicate event: ${summary} (ID: ${existingEvent.id})`);
        return existingEvent.id;
      }

      // Strategy B: Fallback Check by content (Title + Time)
      // Only if metadata check fails but we suspect it might be there (legacy events)
      // We can skip this if we assume all app-created events have metadata now.
    }

    const event: any = {
      summary: summary,
      description: 'Auto-scheduled by DiggiClass',
      start: { dateTime: startDateTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      end: { dateTime: endDateTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      colorId: colorId,
      extendedProperties: {}
    };

    // Add Metadata for future dup checks
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

    console.log(`[CalendarService] Created event: ${request.result.id}`);
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
    if (!window.gapi?.client?.getToken()) {
      return false;
    }

    const startDateTime = new Date(`${date}T${time}:00`).toISOString();
    // End time is 1 hour after start time
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

    console.log(`[CalendarService] Updated event: ${eventId}`);
    return true;
  } catch (err) {
    console.error(`[CalendarService] Error updating event ${eventId}`, err);
    return false;
  }
};

export const deleteEventFromCalendar = async (eventId: string): Promise<boolean> => {
  try {
    if (!window.gapi?.client?.getToken()) {
      return false;
    }

    if (!window.gapi?.client?.calendar) return false;

    await window.gapi.client.calendar.events.delete({
      'calendarId': 'primary',
      'eventId': eventId
    });
    console.log(`[CalendarService] Deleted event: ${eventId}`);
    return true;
  } catch (err) {
    console.error(`[CalendarService] Error deleting event ${eventId}`, err);
    return false;
  }
};

export const signOut = () => {
  const token = window.gapi?.client?.getToken();
  if (token) {
    // Revoke the token with Google
    if (window.google?.accounts?.oauth2) {
      window.google.accounts.oauth2.revoke(token.access_token, () => {
        console.log('[CalendarService] Token revoked');
      });
    }
    // Clear local gapi token
    window.gapi.client.setToken(null);
    console.log('[CalendarService] Signed out');
  }
};



/**
 * Lists events within a time range.
 * @param timeMin ISO string date (default: now)
 * @param maxResults number (default: 200)
 */
export const listEvents = async (timeMin?: string, maxResults: number = 200) => {
  try {
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