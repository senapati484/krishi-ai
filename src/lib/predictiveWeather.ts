import { GoogleGenAI } from "@google/genai";
import type { WeatherData, WeatherAlert } from "./weather";
import type { IDiagnosis } from "@/models/Diagnosis";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

if (!GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY not found in environment variables");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export interface PredictiveAlert extends WeatherAlert {
  predictedRisk: 'low' | 'moderate' | 'high' | 'critical';
  timeWindow: string; // e.g., "next 3 hours", "next 24 hours"
  recommendedActions: string[];
  confidence: number; // 0-1
}

export async function generatePredictiveAlerts(
  weather: WeatherData,
  diseaseHistory: IDiagnosis[],
  crops: string[],
  language: string = 'hi'
): Promise<PredictiveAlert[]> {
  try {
    const languageMap: Record<string, string> = {
      hi: 'Hindi',
      bn: 'Bengali',
      en: 'English',
    };

    const prompt = `
You are an expert agricultural meteorologist and plant pathologist. Analyze the following weather data and disease history to predict potential crop disease risks in the next 3-24 hours.

Current Weather:
- Temperature: ${weather.temp}°C
- Humidity: ${weather.humidity}%
- Rainfall (next 24h): ${weather.rainfall}mm
- Wind Speed: ${weather.windSpeed} m/s
- Condition: ${weather.condition}

Crops Being Grown: ${crops.join(', ') || 'Unknown'}

Recent Disease History (last 3 months):
${diseaseHistory.length > 0
  ? diseaseHistory.slice(0, 10).map((d, i) =>
      `${i + 1}. ${d.crop} - ${d.disease?.name || 'No disease'} (${d.disease?.severity || 'N/A'}) on ${new Date(d.timestamp).toLocaleDateString()}`
    ).join('\n')
  : 'No disease history'
}

Based on this data, predict potential disease risks in the next 3-24 hours. Consider:
1. Weather patterns that favor disease development (high humidity + rain = fungal diseases)
2. Temperature extremes that stress crops
3. Historical disease patterns
4. Crop-specific vulnerabilities

Provide your analysis in ${languageMap[language] || 'Hindi'} in JSON format:
{
  "alerts": [
    {
      "type": "rain|storm|extreme_temp|high_humidity|drought|disease_risk",
      "severity": "low|moderate|high|critical",
      "predictedRisk": "low|moderate|high|critical",
      "message": "clear alert message",
      "cropImpact": "specific impact on crops",
      "timeWindow": "next 3 hours|next 6 hours|next 12 hours|next 24 hours",
      "recommendedActions": ["action 1", "action 2", "action 3"],
      "confidence": 0.85
    }
  ]
}

Focus on actionable, time-sensitive predictions that farmers can act upon immediately.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          parts: [
            { text: prompt },
          ],
        },
      ],
    });

    const text = response.text || "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.alerts || [];
    }

    return [];
  } catch (error) {
    console.error('Error generating predictive alerts:', error);
    // Fallback to basic alerts
    return [];
  }
}

export function combineAlerts(
  basicAlerts: WeatherAlert[],
  predictiveAlerts: PredictiveAlert[]
): PredictiveAlert[] {
  const combined: PredictiveAlert[] = [];

  // Add basic alerts with default predictive properties
  basicAlerts.forEach(alert => {
    combined.push({
      ...alert,
      predictedRisk: alert.severity,
      timeWindow: 'next 24 hours',
      recommendedActions: getDefaultActions(alert.type, alert.severity),
      confidence: 0.7,
    });
  });

  // Add predictive alerts, avoiding duplicates
  predictiveAlerts.forEach(predAlert => {
    const exists = combined.some(a => 
      a.type === predAlert.type && 
      a.message === predAlert.message
    );
    if (!exists) {
      combined.push(predAlert);
    }
  });

  // Sort by severity and confidence
  return combined.sort((a, b) => {
    const severityOrder = { critical: 4, high: 3, moderate: 2, low: 1 };
    const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
    if (severityDiff !== 0) return severityDiff;
    return b.confidence - a.confidence;
  });
}

function getDefaultActions(type: string, severity: string): string[] {
  const actions: Record<string, string[]> = {
    rain: [
      'Ensure proper drainage in fields',
      'Monitor for waterlogging',
      'Apply preventive fungicides if humidity is high',
    ],
    storm: [
      'Secure farm structures',
      'Protect young plants',
      'Harvest mature crops if possible',
    ],
    extreme_temp: [
      'Increase irrigation frequency',
      'Provide shade for sensitive crops',
      'Monitor for heat stress symptoms',
    ],
    high_humidity: [
      'Apply preventive fungicides',
      'Improve air circulation',
      'Avoid overhead watering',
    ],
    drought: [
      'Increase irrigation',
      'Apply mulch to retain moisture',
      'Monitor soil moisture levels',
    ],
  };

  return actions[type] || ['Monitor crops closely', 'Take preventive measures'];
}


