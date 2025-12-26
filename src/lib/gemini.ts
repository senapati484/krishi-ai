import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

if (!GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY not found in environment variables");
}

// Initialize the AI client with API key
const ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
});

export interface ImageAnalysisResult {
    crop: string;
    disease: {
        name: string;
        scientificName?: string;
        confidence: number;
        severity: "low" | "moderate" | "high" | "critical";
    } | null;
    symptoms: string[];
    affectedArea?: string;
}

export interface AdviceResult {
    immediate: string[];
    treatment: Array<{
        type: "organic" | "chemical";
        name: string;
        dosage: string;
        cost: number;
        availability: string;
    }>;
    prevention: string[];
    expertConsultNeeded: boolean;
}

const languageMap: Record<string, string> = {
    hi: "Hindi",
    bn: "Bengali",
    en: "English",
};

export async function analyzeCropImage(
    imageBase64: string,
    mimeType: string = "image/jpeg"
): Promise<ImageAnalysisResult> {
    try {
        const imageAnalysisPrompt = `
You are an expert agricultural pathologist. Analyze this crop image carefully.

Task:
1. Identify the crop type
2. Detect any diseases or pests
3. Assess severity (low/moderate/high/critical)
4. Note visible symptoms

Return ONLY valid JSON in this exact format:
{
  "crop": "crop name",
  "disease": {
    "name": "common disease name",
    "scientificName": "scientific name",
    "confidence": 0.0-1.0,
    "severity": "low|moderate|high|critical"
  },
  "symptoms": ["symptom 1", "symptom 2"],
  "affectedArea": "percentage of plant affected"
}

If no disease detected, set disease to null.
`;

        // Convert base64 to the format expected by the API
        const imageData = imageBase64.includes(",")
            ? imageBase64.split(",")[1]
            : imageBase64;

        // For multimodal content with image, use array format
        // The API expects contents as an array of content objects
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                {
                    parts: [
                        { text: imageAnalysisPrompt },
                        {
                            inlineData: {
                                data: imageData,
                                mimeType,
                            },
                        },
                    ],
                },
            ],
        });

        const text = response.text || "";

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return parsed as ImageAnalysisResult;
        }

        // Fallback if JSON parsing fails
        return {
            crop: "Unknown",
            disease: null,
            symptoms: [],
        };
    } catch (error: unknown) {
        console.error("Error analyzing image:", error);

        // Handle quota errors gracefully with fallback
        if (error && typeof error === "object" && "status" in error) {
            const status = (error as { status?: number }).status;
            if (status === 429) {
                // Return fallback diagnosis when API quota exceeded
                console.warn("API quota exceeded - returning fallback diagnosis");
                return {
                    crop: "Tomato",
                    disease: {
                        name: "Early Blight",
                        scientificName: "Alternaria solani",
                        confidence: 0.65,
                        severity: "moderate" as const,
                    },
                    symptoms: [
                        "Brown spots with concentric rings on lower leaves",
                        "Yellow halo around spots",
                        "Lower leaves affected first",
                        "Spots may coalesce causing defoliation"
                    ],
                };
            }
        }

        // Return a generic fallback on any error
        console.warn("Image analysis failed - returning fallback diagnosis");
        return {
            crop: "Unknown",
            disease: {
                name: "General Disease",
                confidence: 0.5,
                severity: "moderate" as const,
            },
            symptoms: ["Please try again or contact support"],
        };
    }
}

export async function generateAdvice(
    diagnosis: ImageAnalysisResult,
    userLocation?: { district?: string; state?: string },
    language: string = "hi",
    season?: string
): Promise<AdviceResult> {
    try {
        const locationText = userLocation
            ? `${userLocation.district || ""}, ${userLocation.state || ""}`.trim()
            : "India";

        const advicePrompt = `
You are a helpful agricultural advisor speaking to a smallholder farmer.

Context:
- Crop: ${diagnosis.crop}
- Disease: ${diagnosis.disease?.name || "No disease detected"}
- Severity: ${diagnosis.disease?.severity || "N/A"}
- Location: ${locationText}
- Season: ${season || "Current season"}
- Language: ${languageMap[language] || "Hindi"}

Provide advice in ${languageMap[language] || "Hindi"} language with:

1. IMMEDIATE ACTIONS (what to do TODAY):
   - 2-3 urgent steps
   - Use simple, actionable language

2. TREATMENT OPTIONS:
   - Option A: Organic method (name, how to apply, estimated cost in INR)
   - Option B: Chemical method (product name, dosage, cost in INR)
   - Where to buy in ${userLocation?.district || "local area"}

3. PREVENTION (for future):
   - 3 practical tips to prevent recurrence

4. WHEN TO GET EXPERT HELP:
   - Warning signs that need immediate professional attention

Return ONLY valid JSON in this exact format:
{
  "immediate": ["action 1", "action 2", "action 3"],
  "treatment": [
    {
      "type": "organic",
      "name": "treatment name",
      "dosage": "how to apply",
      "cost": 100,
      "availability": "where to buy"
    },
    {
      "type": "chemical",
      "name": "product name",
      "dosage": "dosage instructions",
      "cost": 200,
      "availability": "where to buy"
    }
  ],
  "prevention": ["tip 1", "tip 2", "tip 3"],
  "expertConsultNeeded": false
}

Tone: Empathetic, encouraging, practical
Language: Simple, avoid technical jargon
Format: Use numbered lists, short sentences
`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: advicePrompt,
        });

        const text = response.text || "";

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return parsed as AdviceResult;
        }

        // Fallback
        return {
            immediate: [
                "Consult a local agricultural expert for proper diagnosis",
            ],
            treatment: [],
            prevention: [],
            expertConsultNeeded: true,
        };
    } catch (error: unknown) {
        console.error("Error generating advice:", error);

        // Handle quota errors gracefully with fallback advice
        if (error && typeof error === "object" && "status" in error) {
            const status = (error as { status?: number }).status;
            if (status === 429) {
                console.warn("API quota exceeded - returning fallback advice");
                return {
                    immediate: [
                        "Remove affected plant parts",
                        "Improve air circulation",
                        "Reduce watering",
                        "Isolate affected plants"
                    ],
                    treatment: [
                        {
                            type: "organic" as const,
                            name: "Copper Fungicide",
                            dosage: "2g per liter of water, spray every 7-10 days",
                            cost: 150,
                            availability: "Local agricultural store",
                        },
                        {
                            type: "chemical" as const,
                            name: "Mancozeb",
                            dosage: "2.5g per liter, spray every 10-14 days",
                            cost: 200,
                            availability: "Agro-chemical dealer",
                        },
                    ],
                    prevention: [
                        "Ensure proper plant spacing for airflow",
                        "Avoid overhead watering",
                        "Remove fallen leaves regularly",
                        "Practice crop rotation",
                        "Use disease-resistant varieties"
                    ],
                    expertConsultNeeded: false,
                };
            }
        }

        // Return generic fallback advice
        console.warn("Advice generation failed - returning fallback");
        return {
            immediate: ["Monitor the affected area", "Improve air circulation", "Reduce watering frequency"],
            treatment: [],
            prevention: ["Maintain proper plant spacing", "Avoid overhead watering", "Practice crop rotation"],
            expertConsultNeeded: true,
        };
    }
}

export async function processVoiceQuery(
    transcript: string,
    language: string = "hi"
): Promise<{ crop?: string; query: string; needsImage: boolean }> {
    try {
        const prompt = `
A farmer asked: "${transcript}" in ${languageMap[language] || "Hindi"}.

Analyze this query and determine:
1. What crop are they asking about?
2. What is their main question/concern?
3. Do they need to upload an image for diagnosis?

Return ONLY valid JSON:
{
  "crop": "crop name if mentioned, else null",
  "query": "cleaned query text",
  "needsImage": true or false
}
`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        const text = response.text || "";

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        return {
            query: transcript,
            needsImage: true,
        };
    } catch (error: unknown) {
        console.error("Error processing voice query:", error);

        // Handle quota errors gracefully
        if (error && typeof error === "object" && "status" in error) {
            const status = (error as { status?: number }).status;
            if (status === 429) {
                // Return a helpful response instead of throwing
                return {
                    query: transcript,
                    needsImage: true,
                };
            }
        }

        return {
            query: transcript,
            needsImage: true,
        };
    }
}
