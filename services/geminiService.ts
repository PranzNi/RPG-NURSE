import { GoogleGenAI, Type } from "@google/genai";
import { Question, Monster } from "../types";

// Helper to get API key safely
const getClient = () => {
  // Hardcoded API key as requested
  const apiKey = "AIzaSyDjIn1scXyYCGVHs0Pd8F_sELACaFejPnY";
  return new GoogleGenAI({ apiKey });
};

export const generateNursingQuestion = async (level: number, topic: string = "General Nursing"): Promise<Question> => {
  const client = getClient();
  
  // Difficulty scaling logic
  const difficultyContext = level <= 3 ? "Beginner Nursing Student" 
    : level <= 6 ? "Intermediate" 
    : "Advanced / NCLEX Level";

  const prompt = `
    Generate a multiple-choice nursing question.
    Topic: "${topic}".
    Target Level: ${level} (${difficultyContext}).
    The question should be strictly related to the Topic provided.
    Provide 4 options.
  `;

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING, description: "The question stem." },
            options: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "4 possible answers."
            },
            correctIndex: { type: Type.INTEGER, description: "Index of the correct answer (0-3)." },
            explanation: { type: Type.STRING, description: "Rationale for the correct answer." },
            category: { type: Type.STRING, description: "The sub-category (e.g., Anatomy, Ethics)." }
          },
          required: ["text", "options", "correctIndex", "explanation", "category"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");
    
    const data = JSON.parse(jsonText);
    return {
      id: crypto.randomUUID(),
      difficulty: level,
      ...data
    };
  } catch (error) {
    console.error("Error generating question:", error);
    // Fallback question in case of API failure
    return {
      id: crypto.randomUUID(),
      text: `Which action is most important in ${topic}? (Fallback Question - API Error)`,
      options: ["Safety", "Documentation", "Speed", "Comfort"],
      correctIndex: 0,
      explanation: "Safety is always the priority.",
      difficulty: 1,
      category: topic
    };
  }
};

export const generateMonster = async (level: number, topic: string = "General"): Promise<Monster> => {
  const client = getClient();

  const prompt = `
    Generate a fantasy RPG monster based on the medical topic: "${topic}".
    The monster is level ${level}.
    It should be a creative metaphor for a disease, concept, or equipment related to ${topic}.
    (e.g., if topic is "Nutrition", maybe "The Gluttony Golem" or "Vitamin Void").
    (e.g., if topic is "Fundamentals", maybe "The Red Tape Wraith" or "Bed Sore Beast").
  `;

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
          },
          required: ["name", "description"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");
    
    const data = JSON.parse(jsonText);

    // Calculate stats based on level
    const hp = 50 + (level * 20); // Base 50 + 20 per level
    const damage = 5 + (level * 2); // Base 5 + 2 per level

    return {
      id: crypto.randomUUID(),
      name: data.name,
      description: data.description,
      level: level,
      maxHp: hp,
      hp: hp,
      damage: damage,
      activeDebuffs: {
        stunned: 0,
        poison: 0,
        burn: 0
      }
    };
  } catch (error) {
    console.error("Error generating monster:", error);
    return {
      id: crypto.randomUUID(),
      name: "Generic Pathogen",
      description: "A blob of unknown origin.",
      level: level,
      maxHp: 50 + (level * 20),
      hp: 50 + (level * 20),
      damage: 5 + (level * 2),
      activeDebuffs: {
        stunned: 0,
        poison: 0,
        burn: 0
      }
    };
  }
};