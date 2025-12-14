import { Topic, AppSettings, DEFAULT_SETTINGS, AIInsight } from '../types';
import { db } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';

const KEYS = {
  TOPICS: 'revision_topics',
  SETTINGS: 'revision_settings',
  INSIGHTS: 'revision_ai_insights',
  QUIZ_RESULTS: 'revision_quiz_results',
  MIGRATED: 'revision_migrated_to_firebase',
};

// --- Local Storage Helpers (Legacy/Fallback) ---

export const getLocalTopics = (): Topic[] => {
  const stored = localStorage.getItem(KEYS.TOPICS);
  return stored ? JSON.parse(stored) : [];
};

export const saveLocalTopics = (topics: Topic[]) => {
  localStorage.setItem(KEYS.TOPICS, JSON.stringify(topics));
};

export const getLocalSettings = (): AppSettings => {
  const stored = localStorage.getItem(KEYS.SETTINGS);
  return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
};

export const saveLocalSettings = (settings: AppSettings) => {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
};

// --- Firestore Helpers ---

export const fetchUserData = async (userId: string) => {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        topics: (data.topics as Topic[]) || [],
        settings: (data.settings as AppSettings) ? { ...DEFAULT_SETTINGS, ...data.settings } : DEFAULT_SETTINGS,
        quizResults: data.quizResults || []
      };
    } else {
      // Initialize new user with empty/default data
      return { topics: [], settings: DEFAULT_SETTINGS, quizResults: [] };
    }
  } catch (error) {
    console.error("Error fetching user data from Firestore:", error);
    throw new Error("Failed to load user data. Please check your connection.");
  }
};

export const saveUserTopics = async (userId: string, topics: Topic[]) => {
  try {
    const docRef = doc(db, "users", userId);
    // Merge true to avoid overwriting other fields
    await setDoc(docRef, { topics }, { merge: true });
  } catch (error) {
    console.error("Error saving topics to Firestore:", error);
    // Fall back to local storage
    saveLocalTopics(topics);
    throw new Error("Failed to save topics. Saved locally instead.");
  }
};

export const saveUserSettings = async (userId: string, settings: AppSettings) => {
  try {
    const docRef = doc(db, "users", userId);
    await setDoc(docRef, { settings }, { merge: true });
  } catch (error) {
    console.error("Error saving settings to Firestore:", error);
    saveLocalSettings(settings);
    throw new Error("Failed to save settings. Saved locally instead.");
  }
};

// --- Quiz Results ---

export interface QuizResult {
  id: string;
  examType: string;
  subject: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  completedAt: string;
  answers: { questionId: string; selectedAnswer: string; isCorrect: boolean }[];
}

export const saveQuizResult = async (userId: string, result: QuizResult) => {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    const currentResults = docSnap.exists() ? (docSnap.data().quizResults || []) : [];

    await setDoc(docRef, {
      quizResults: [...currentResults, result]
    }, { merge: true });
  } catch (error) {
    console.error("Error saving quiz result:", error);
    // Fallback to local storage
    const localResults = JSON.parse(localStorage.getItem(KEYS.QUIZ_RESULTS) || '[]');
    localStorage.setItem(KEYS.QUIZ_RESULTS, JSON.stringify([...localResults, result]));
  }
};

export const getQuizResults = async (userId: string): Promise<QuizResult[]> => {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data().quizResults || [];
    }
    return [];
  } catch (error) {
    console.error("Error fetching quiz results:", error);
    // Fallback to local storage
    return JSON.parse(localStorage.getItem(KEYS.QUIZ_RESULTS) || '[]');
  }
};

// --- Real-time Listeners ---

export const subscribeToUserData = (
  userId: string,
  onUpdate: (data: { topics: Topic[]; settings: AppSettings }) => void
): Unsubscribe => {
  const docRef = doc(db, "users", userId);

  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      onUpdate({
        topics: (data.topics as Topic[]) || [],
        settings: (data.settings as AppSettings) ? { ...DEFAULT_SETTINGS, ...data.settings } : DEFAULT_SETTINGS
      });
    }
  }, (error) => {
    console.error("Error in real-time listener:", error);
  });
};

// --- Data Migration ---

export const checkAndMigrateData = async (userId: string): Promise<boolean> => {
  // Check if already migrated
  const migrated = localStorage.getItem(KEYS.MIGRATED);
  if (migrated === 'true') {
    return false;
  }

  const localTopics = getLocalTopics();
  const localSettings = getLocalSettings();

  // Only migrate if there's local data
  if (localTopics.length > 0 || JSON.stringify(localSettings) !== JSON.stringify(DEFAULT_SETTINGS)) {
    try {
      // Check if Firestore already has data
      const firestoreData = await fetchUserData(userId);

      // Only migrate if Firestore is empty
      if (firestoreData.topics.length === 0) {
        const docRef = doc(db, "users", userId);
        await setDoc(docRef, {
          topics: localTopics,
          settings: localSettings,
          quizResults: JSON.parse(localStorage.getItem(KEYS.QUIZ_RESULTS) || '[]')
        });

        console.log("Successfully migrated local data to Firestore");
      }

      // Mark as migrated
      localStorage.setItem(KEYS.MIGRATED, 'true');
      return true;
    } catch (error) {
      console.error("Error during data migration:", error);
      return false;
    }
  }

  // No data to migrate
  localStorage.setItem(KEYS.MIGRATED, 'true');
  return false;
};

// --- Export/Import Functions ---
export const getAllData = () => {
  return {
    topics: getLocalTopics(),
    settings: getLocalSettings(),
    quizResults: JSON.parse(localStorage.getItem(KEYS.QUIZ_RESULTS) || '[]')
  };
};

export const importAppData = (jsonString: string): boolean => {
  try {
    const data = JSON.parse(jsonString);
    if (data.topics) saveLocalTopics(data.topics);
    if (data.settings) saveLocalSettings(data.settings);
    if (data.quizResults) localStorage.setItem(KEYS.QUIZ_RESULTS, JSON.stringify(data.quizResults));
    return true;
  } catch (error) {
    console.error('Failed to import data:', error);
    return false;
  }
};

// --- Legacy Exports (to be removed or updated) ---
export const getTopics = getLocalTopics;
export const saveTopics = saveLocalTopics;
export const getSettings = getLocalSettings;
export const saveSettings = saveLocalSettings;