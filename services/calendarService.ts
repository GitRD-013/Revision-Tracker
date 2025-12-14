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
let activeClientId: string = '';

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

  // We assign to the module-level variable, effectively overwriting any old instance
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: 'https://www.googleapis.com/auth/calendar.events',
    ux_mode: 'popup', // Explicitly enforce popup mode
    callback: '', // Defined at request time, but required here
  });

  activeClientId = clientId;
};

export const handleAuthClick = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      console.error("[CalendarService] TokenClient is missing. Was initGapi called?");
      return reject("Google Calendar services not initialized. Please refresh or check settings.");
    }

    console.log(`[CalendarService] Requesting Access Token. Active Client ID: ${activeClientId}`);
    console.log(`[CalendarService] Current Origin: ${window.location.origin}`);

    tokenClient.callback = async (resp: any) => {
      if (resp.error) {
        console.error("[CalendarService] Auth Error:", resp);
        reject(resp);
      }
      console.log("[CalendarService] Auth Success");
      resolve();
    };

    // Standard practice for GIS: always request prompt on first interactive click
    // or if we suspect the token is missing.
    if (window.gapi.client.getToken() === null) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      tokenClient.requestAccessToken({ prompt: '' });
    }
  });
};

export const restoreSession = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!tokenClient) {
      // Not initialized yet
      resolve(false);
      return;
    }

    console.log("[CalendarService] Attempting silent restore...");
    tokenClient.callback = (resp: any) => {
      if (resp.error) {
        console.warn("[CalendarService] Silent restore failed", resp);
        resolve(false);
      } else {
        console.log("[CalendarService] Silent restore success");
        resolve(true);
      }
    };

    // Prompt '' attempts to use existing cookie/session without force-showing popup if possible.
    // 'none' was causing a blank window issue for some users.
    tokenClient.requestAccessToken({ prompt: '' });
  });
};

const ensureToken = async (): Promise<boolean> => {
  if (checkIsSignedIn()) return true;
  console.log("[CalendarService] No active token, attempting silent restore...");
  const restored = await restoreSession();
  if (restored) return true;

  console.log("[CalendarService] Silent restore failed. Attempting interactive login...");
  try {
    // Fallback to interactive login if silent restore fails
    // This allows the user to re-authenticate if their session expired
    await handleAuthClick();
    return true;
  } catch (error) {
    console.error("[CalendarService] Interactive login failed", error);
    return false;
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

export const addEventToCalendar = async (
  title: string,
  date: string,
  subject?: string,
  time: string = '09:00', // Default 9 AM
  colorId: string = '9'   // Default Blueberry
): Promise<string | null> => {
  try {
    if (!await ensureToken()) {
      console.warn("[CalendarService] Failed to obtain token for addEvent");
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

    const event = {
      summary: summary,
      description: 'Auto-scheduled by DiggiClass',
      start: { dateTime: startDateTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      end: { dateTime: endDateTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      colorId: colorId,
    };

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

export const deleteEventFromCalendar = async (eventId: string): Promise<boolean> => {
  try {
    if (!await ensureToken()) {
      console.warn("[CalendarService] Failed to obtain token for deleteEvent");
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

export const checkIsSignedIn = () => {
  return !!window.gapi?.client?.getToken();
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