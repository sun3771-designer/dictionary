
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { DictionaryEntry } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const dictionarySchema = {
  type: Type.OBJECT,
  properties: {
    word: { type: Type.STRING },
    ipa: { type: Type.STRING },
    frequency: {
      type: Type.OBJECT,
      properties: {
        spoken: { type: Type.STRING, description: "S1, S2, or S3 based on LDOCE frequency" },
        written: { type: Type.STRING, description: "W1, W2, or W3 based on LDOCE frequency" }
      }
    },
    definitions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          pos: { type: Type.STRING, description: "e.g., verb, noun, adjective" },
          pattern: { type: Type.STRING, description: "Grammar pattern, e.g., '[C]', '[U]', '[T]', '[I]'" },
          meaning: { type: Type.STRING, description: "The core definition in simple Longman 2000-word vocabulary style" },
          examples: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Authentic examples" },
          collocations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Typical word combinations" }
        },
        required: ["pos", "meaning", "examples"]
      }
    },
    phrasal_verbs: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          phrase: { type: Type.STRING },
          meaning: { type: Type.STRING },
          examples: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["phrase", "meaning", "examples"]
      }
    },
    derivatives: { type: Type.ARRAY, items: { type: Type.STRING } },
    synonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
    antonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
    origin: { type: Type.STRING },
    usage_note: { type: Type.STRING },
    translation: {
      type: Type.OBJECT,
      properties: {
        sourceText: { type: Type.STRING },
        translatedText: { type: Type.STRING },
        isSentence: { type: Type.BOOLEAN, description: "True if the input was a full sentence rather than a single word" }
      }
    }
  },
  required: ["word", "ipa", "definitions", "synonyms", "antonyms"]
};

export const fetchWordDetails = async (word: string): Promise<DictionaryEntry> => {
  const isChinese = /[\u4e00-\u9fa5]/.test(word);
  
  const prompt = isChinese 
    ? `The user provided a Chinese input: "${word}". 
       1. Translate it to the most appropriate English word or phrase.
       2. If it's a single word, provide a full LDOCE-style dictionary entry for that English translation.
       3. If it's a sentence, provide the translation and minimal dictionary info.
       Include the original Chinese in translation.sourceText and the English in translation.translatedText.`
    : `Act as a master lexicographer for the Longman Dictionary of Contemporary English (LDOCE). 
       Provide a detailed entry for "${word}".
       Include grammar tags like [C], [U], [T], [I]. Use Longman 2000-word vocabulary for definitions.
       Identify if this is a high-frequency word (S1-S3, W1-W3).`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: dictionarySchema,
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  return JSON.parse(text);
};

export const fetchSuggestions = async (query: string): Promise<string[]> => {
  if (query.length < 2) return [];
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a list of 5 common English words starting with or similar to "${query}". Return only a JSON array of strings.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch {
    return [];
  }
};

/**
 * 使用 Gemini TTS 生成真人级语音 (美式发音)
 */
export const fetchAudio = async (text: string): Promise<string | undefined> => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Pronounce clearly in a standard American English accent: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Puck' }, // Puck 是非常棒的美式男声
        },
      },
    },
  });

  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};
