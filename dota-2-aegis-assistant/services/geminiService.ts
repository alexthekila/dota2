
import { GoogleGenAI, Type } from "@google/genai";
import { Hero, Team, PlayerRole } from "../types";

// Initialize the Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Models ---
// "Think more" - Complex Analysis
const THINKING_MODEL = 'gemini-3-pro-preview';
// "Fast AI" - Quick counters - Fixed model name
const FAST_MODEL = 'gemini-2.5-flash';
// "Search Grounding" - Meta analysis
const SEARCH_MODEL = 'gemini-2.5-flash';
// "Analyze images" - Image analysis
const VISION_MODEL = 'gemini-3-pro-preview';

/**
 * Performs a deep analysis of the current draft using the thinking model.
 */
export const analyzeDraft = async (
  radiantHeroes: Hero[], 
  direHeroes: Hero[], 
  userSide: Team,
  userRole: PlayerRole
) => {
  const prompt = `
    Analyze this Dota 2 draft.
    Radiant Picks: ${radiantHeroes.map(h => h.name).join(', ')}
    Dire Picks: ${direHeroes.map(h => h.name).join(', ')}

    Context: The user is playing on ${userSide} side as ${userRole}.

    Provide a strategic breakdown including:
    1. Win rate prediction (percentage for Radiant).
    2. Team Composition Ratings (1-10) for both teams on these metrics: Teamfight, Push, Lategame, Laning, Control.
    3. Key strengths for Radiant.
    4. Key strengths for Dire.
    5. Suggested next picks (Top 3). For each suggestion, provide the hero name and a specific strategic reason why they are good here.
    6. Lane matchup analysis.
    7. Personal Advice: Specific tips for the user playing ${userRole} on ${userSide} given the current heroes.
    8. Recommended Items: Suggest 4 key items for the user (${userRole}). If there is a clear hero for this role in the draft on the user's team, suggest for that hero. If not, suggest items that counter the enemy team for this role. Provide the item name, the exact internal id/slug (e.g., "blink" or "black_king_bar"), and the reason.
    
    Think carefully about hero synergies and counters.
  `;

  try {
    const response = await ai.models.generateContent({
      model: THINKING_MODEL,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 32768 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            winRatePrediction: { type: Type.NUMBER, description: "Radiant win probability 0-100" },
            radiantStats: {
              type: Type.OBJECT,
              properties: {
                teamfight: { type: Type.NUMBER },
                push: { type: Type.NUMBER },
                lategame: { type: Type.NUMBER },
                laning: { type: Type.NUMBER },
                control: { type: Type.NUMBER }
              },
              required: ["teamfight", "push", "lategame", "laning", "control"]
            },
            direStats: {
              type: Type.OBJECT,
              properties: {
                teamfight: { type: Type.NUMBER },
                push: { type: Type.NUMBER },
                lategame: { type: Type.NUMBER },
                laning: { type: Type.NUMBER },
                control: { type: Type.NUMBER }
              },
              required: ["teamfight", "push", "lategame", "laning", "control"]
            },
            radiantStrengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            direStrengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedPicks: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT,
                properties: {
                  heroName: { type: Type.STRING },
                  reason: { type: Type.STRING, description: "Strategic reason for this pick" }
                }
              }, 
              description: "Top 3 suggestions with reasoning" 
            },
            itemRecommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  itemName: { type: Type.STRING },
                  itemSlug: { type: Type.STRING, description: "Dota 2 item slug, e.g. 'sheepstick' or 'black_king_bar'" },
                  reason: { type: Type.STRING }
                }
              }
            },
            laneAnalysis: { type: Type.STRING, description: "Detailed lane breakdown" },
            personalAdvice: { type: Type.STRING, description: "Specific advice for the user's role and side" },
            thinkingProcess: { type: Type.STRING, description: "Brief summary of the reasoning" }
          },
          required: ["winRatePrediction", "radiantStats", "direStats", "radiantStrengths", "direStrengths", "laneAnalysis", "personalAdvice", "suggestedPicks", "itemRecommendations"]
        }
      }
    });
    
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error analyzing draft:", error);
    throw error;
  }
};

/**
 * Quickly gets counter suggestions using the fast model.
 */
export const getQuickCounters = async (enemyHeroes: Hero[]) => {
  if (enemyHeroes.length === 0) return [];

  const prompt = `
    List 5 strong counter picks against these Dota 2 heroes: ${enemyHeroes.map(h => h.name).join(', ')}.
    Only return the hero names in a JSON array.
  `;

  try {
    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error fetching counters:", error);
    return [];
  }
};

/**
 * Identifies good and bad matchups for the hero grid visualization.
 */
export const getBatchMatchups = async (enemyHeroes: Hero[]) => {
  if (enemyHeroes.length === 0) return { goodAgainst: [], badAgainst: [] };

  const prompt = `
    Considering these Enemy Heroes: ${enemyHeroes.map(h => h.name).join(', ')}.
    
    Identify 15 heroes that are VERY STRONG counters to them (good picks).
    Identify 15 heroes that are WEAK against them (bad picks).
    
    Return valid hero names only.
  `;

  try {
    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            goodAgainst: { type: Type.ARRAY, items: { type: Type.STRING } },
            badAgainst: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["goodAgainst", "badAgainst"]
        }
      }
    });
    
    const parsed = JSON.parse(response.text || '{}');
    return {
        goodAgainst: Array.isArray(parsed.goodAgainst) ? parsed.goodAgainst : [],
        badAgainst: Array.isArray(parsed.badAgainst) ? parsed.badAgainst : []
    };
  } catch (error) {
    console.error("Error fetching batch matchups:", error);
    return { goodAgainst: [], badAgainst: [] };
  }
};

/**
 * Gets current meta trends using Google Search.
 */
export const getMetaInsights = async (heroName: string) => {
  const prompt = `What is the current win rate and popularity trend for ${heroName} in high MMR Dota 2 matches? Use search to find the latest patch statistics (7.37 or later). Summarize briefly.`;

  try {
    const response = await ai.models.generateContent({
      model: SEARCH_MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    
    return {
      text: response.text,
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.error("Error fetching meta insights:", error);
    return { text: "Could not fetch meta data.", sources: [] };
  }
};

/**
 * Chat with the AI assistant about the game.
 */
export const chatWithAssistant = async (history: { role: string, parts: { text: string }[] }[], message: string) => {
  try {
    const chat = ai.chats.create({
      model: THINKING_MODEL,
      history: history,
      config: {
        thinkingConfig: { thinkingBudget: 16000 },
      }
    });
    
    const result = await chat.sendMessage({ message });
    return result.text;
  } catch (error) {
    console.error("Chat error:", error);
    throw error;
  }
};

/**
 * Analyzes an uploaded image of a draft screen.
 */
export const analyzeScreenshot = async (base64Image: string, mimeType: string) => {
  try {
    const response = await ai.models.generateContent({
      model: VISION_MODEL,
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType } },
          { text: "Identify the heroes in this Dota 2 draft screenshot. List Radiant heroes and Dire heroes. Then provide a quick assessment of which team has the better late game." }
        ]
      },
      config: {
        thinkingConfig: { thinkingBudget: 16000 }
      }
    });
    return response.text;
  } catch (error) {
    console.error("Vision error:", error);
    throw error;
  }
};
