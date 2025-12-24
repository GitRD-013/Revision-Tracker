import { GoogleGenAI, Type } from "@google/genai";
import { Topic, RevisionStatus, AIInsight, MCQQuestion } from '../types';

// Lazy init to prevent crash on load if env is missing
let aiInstance: GoogleGenAI | null = null;
const getAI = () => {
  if (!aiInstance) {
    const key = import.meta.env.VITE_GEMINI_API_KEY;
    if (!key) {
      console.error("DEBUG: VITE_GEMINI_API_KEY is missing from env");
      // throw new Error("API Key is missing"); // Don't throw, just let calls fail gracefully
    }
    aiInstance = new GoogleGenAI({ apiKey: key || 'dummy_key_to_prevent_crash' });
  }
  return aiInstance;
};

export const generateTopicContent = async (_title: string, _subject: string): Promise<null> => {
  return null;
};

export const optimizeSchedule = async (_title: string, _difficulty: string, _performance: string): Promise<number[] | null> => {
  return null;
};

export const analyzeProgress = async (topics: Topic[]): Promise<AIInsight | null> => {
  try {
    // 1. Prepare Data Summary
    let totalRevisions = 0;
    let completed = 0;
    let missed = 0;
    const subjectBreakdown: Record<string, { completed: number, total: number }> = {};

    topics.forEach(t => {
      if (!subjectBreakdown[t.subject]) subjectBreakdown[t.subject] = { completed: 0, total: 0 };

      t.revisions.forEach(r => {
        totalRevisions++;
        subjectBreakdown[t.subject].total++;
        if (r.status === RevisionStatus.COMPLETED) {
          completed++;
          subjectBreakdown[t.subject].completed++;
        } else if (r.status === RevisionStatus.MISSED) {
          missed++;
        }
      });
    });

    const completionRate = totalRevisions > 0 ? (completed / totalRevisions) : 0;

    const promptData = {
      totalTopics: topics.length,
      completionRate: completionRate.toFixed(2),
      missedSessions: missed,
      subjectPerformance: subjectBreakdown
    };

    // 2. Call Gemini
    const response = await getAI().models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze this study data for a student and provide a productivity report.
      Data: ${JSON.stringify(promptData)}
      
      The 'productivityScore' should be an integer from 0-100 based on completion rate and consistency.
      The 'summary' should be a 2-3 sentence weekly report style summary of their progress.
      The 'tips' should be an array of 2 short, actionable study tips based on the data.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            productivityScore: { type: Type.INTEGER },
            summary: { type: Type.STRING },
            tips: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["productivityScore", "summary", "tips"]
        }
      }
    });

    // 3. Parse and Return
    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const result = JSON.parse(text);

    return {
      productivityScore: result.productivityScore,
      summary: result.summary,
      tips: result.tips,
      lastUpdated: new Date().toISOString()
    };

  } catch (error) {
    console.error("AI Analysis failed:", error);
    console.error("AI Analysis failed:", error);
    return null;
  }
};

export const generateQuiz = async (topic: string, subject: string, count: number = 5): Promise<MCQQuestion[] | null> => {
  try {
    const response = await getAI().models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate ${count} multiple-choice questions (MCQs) for the topic "${topic}" in the subject "${subject}".
            Expected JSON format:
            Array of objects with:
            - question: string
            - options: array of 4 strings
            - correctAnswerIndex: integer (0-3)
            - explanation: string (brief explanation of why the answer is correct)
            `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswerIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING }
            },
            required: ["question", "options", "correctAnswerIndex", "explanation"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const output = JSON.parse(text);

    // Add random IDs
    return output.map((q: any) => ({
      ...q,
      id: crypto.randomUUID()
    }));

  } catch (error) {
    console.error("Quiz generation failed:", error);
    return null;
  }
};