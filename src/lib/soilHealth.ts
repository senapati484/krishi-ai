import { GoogleGenAI } from "@google/genai";
import type { ISoilTest } from "@/models/SoilTest";
import type { IDiagnosis } from "@/models/Diagnosis";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

if (!GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY not found in environment variables");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export interface CropRecommendation {
    crop: string;
    suitability: 'excellent' | 'good' | 'moderate' | 'poor';
    reason: string;
    expectedYield?: string;
    plantingSeason?: string;
}

export interface SoilImprovementSuggestion {
    action: string;
    priority: 'high' | 'medium' | 'low';
    description: string;
    materials?: string[];
    cost?: number;
    timeline?: string;
}

export interface SoilHealthAnalysis {
    overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
    recommendations: CropRecommendation[];
    improvements: SoilImprovementSuggestion[];
    summary: string;
}

export async function analyzeSoilHealth(
    soilTest: ISoilTest,
    diseaseHistory: IDiagnosis[],
    language: string = 'hi'
): Promise<SoilHealthAnalysis> {
    try {
        const languageMap: Record<string, string> = {
            hi: 'Hindi',
            bn: 'Bengali',
            en: 'English',
        };

        const prompt = `
You are an expert agricultural soil scientist and agronomist. Analyze the following soil test results and disease history to provide comprehensive recommendations.

Soil Test Results:
- pH: ${soilTest.pH}
- Nitrogen: ${soilTest.nitrogen || 'N/A'} kg/ha
- Phosphorus: ${soilTest.phosphorus || 'N/A'} kg/ha
- Potassium: ${soilTest.potassium || 'N/A'} kg/ha
- Organic Matter: ${soilTest.organicMatter || 'N/A'}%
- Moisture: ${soilTest.moisture || 'N/A'}%
- Texture: ${soilTest.texture || 'N/A'}

Disease History (last 6 months):
${diseaseHistory.length > 0
                ? diseaseHistory.map((d, i) =>
                    `${i + 1}. ${d.crop} - ${d.disease?.name || 'No disease'} (${d.disease?.severity || 'N/A'})`
                ).join('\n')
                : 'No disease history recorded'
            }

Provide your analysis in ${languageMap[language] || 'Hindi'} in the following JSON format:
{
  "overallHealth": "excellent|good|fair|poor",
  "recommendations": [
    {
      "crop": "crop name",
      "suitability": "excellent|good|moderate|poor",
      "reason": "why this crop is suitable",
      "expectedYield": "expected yield range",
      "plantingSeason": "best season to plant"
    }
  ],
  "improvements": [
    {
      "action": "what to do",
      "priority": "high|medium|low",
      "description": "detailed description",
      "materials": ["material1", "material2"],
      "cost": 0,
      "timeline": "how long it takes"
    }
  ],
  "summary": "overall summary of soil health and recommendations"
}

Consider:
1. Soil pH and nutrient levels
2. Disease patterns from history
3. Crop rotation benefits
4. Local farming practices in India
5. Cost-effective solutions for smallholder farmers
`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                {
                    parts: [
                        { text: prompt }
                    ]
                }
            ]
        });

        const text = response.text || "";

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]) as SoilHealthAnalysis;
        }

        // Fallback response
        return {
            overallHealth: 'fair',
            recommendations: [],
            improvements: [],
            summary: 'Unable to analyze soil health. Please consult a local agricultural expert.',
        };
    } catch (error) {
        console.error('Error analyzing soil health:', error);
        throw error;
    }
}

export function getSoilHealthStatus(pH: number, nutrients: { nitrogen?: number; phosphorus?: number; potassium?: number }): 'excellent' | 'good' | 'fair' | 'poor' {
    let score = 0;

    // pH check (optimal: 6.0-7.5)
    if (pH >= 6.0 && pH <= 7.5) {
        score += 3;
    } else if (pH >= 5.5 && pH < 6.0) {
        score += 2;
    } else if (pH > 7.5 && pH <= 8.0) {
        score += 2;
    } else {
        score += 1;
    }

    // Nutrient checks
    if (nutrients.nitrogen && nutrients.nitrogen >= 250) score += 1;
    if (nutrients.phosphorus && nutrients.phosphorus >= 25) score += 1;
    if (nutrients.potassium && nutrients.potassium >= 150) score += 1;

    if (score >= 5) return 'excellent';
    if (score >= 4) return 'good';
    if (score >= 2) return 'fair';
    return 'poor';
}

