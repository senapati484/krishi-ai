"use client";

import { useState, useEffect } from "react";
import {
  X,
  Volume2,
  VolumeX,
  Globe,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { t } from "@/lib/i18n";
import type { Language } from "@/lib/i18n";
import {
  speakText,
  stopSpeaking,
  isSpeakingSupported,
  loadVoices,
  supportedLanguages,
} from "@/lib/textToSpeech";

interface SoilTestDetailProps {
  test: {
    id: string;
    pH: number;
    nitrogen?: number;
    phosphorus?: number;
    potassium?: number;
    organicMatter?: number;
    moisture?: number;
    texture?: string;
    testDate: string;
    recommendations?: string[];
    notes?: string;
  };
  onClose: () => void;
  language: Language;
}

export default function SoilTestDetail({
  test,
  onClose,
  language,
}: SoilTestDetailProps) {
  const [displayLanguage, setDisplayLanguage] = useState<Language>(language);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingSupported] = useState(() => isSpeakingSupported());

  useEffect(() => {
    loadVoices().catch(console.error);
  }, []);

  // Prepare text for speaking
  const getTestSummaryText = (lang: Language): string => {
    const textParts = [
      `${t("soilTest", lang) || "Soil Test"} - ${new Date(test.testDate).toLocaleDateString(lang === 'hi' ? 'hi-IN' : lang === 'bn' ? 'bn-IN' : 'en-US')}`,
      `pH: ${test.pH}`,
    ];

    if (test.nitrogen !== undefined) {
      textParts.push(
        `${t("nitrogen", lang) || "Nitrogen"}: ${test.nitrogen} kg/ha`
      );
    }
    if (test.phosphorus !== undefined) {
      textParts.push(
        `${t("phosphorus", lang) || "Phosphorus"}: ${test.phosphorus} kg/ha`
      );
    }
    if (test.potassium !== undefined) {
      textParts.push(
        `${t("potassium", lang) || "Potassium"}: ${test.potassium} kg/ha`
      );
    }
    if (test.organicMatter !== undefined) {
      textParts.push(
        `${t("organicMatter", lang) || "Organic Matter"}: ${test.organicMatter}%`
      );
    }
    if (test.moisture !== undefined) {
      textParts.push(
        `${t("moisture", lang) || "Moisture"}: ${test.moisture}%`
      );
    }
    if (test.texture) {
      textParts.push(
        `${t("soilTexture", lang) || "Soil Texture"}: ${test.texture}`
      );
    }

    if (test.recommendations && test.recommendations.length > 0) {
      textParts.push(`${t("recommendations", lang) || "Recommendations"}:`);
      test.recommendations.forEach((rec) => {
        textParts.push(`- ${rec}`);
      });
    }

    return textParts.join(". ");
  };

  const handleSpeak = async () => {
    try {
      const text = getTestSummaryText(displayLanguage);
      setIsSpeaking(true);
      await speakText(text, displayLanguage);
      setIsSpeaking(false);
    } catch (error) {
      console.error("Error speaking:", error);
      setIsSpeaking(false);
    }
  };

  const handleStop = () => {
    stopSpeaking();
    setIsSpeaking(false);
  };

  const getStatusColor = (value: number, min: number, max: number): string => {
    if (value < min || value > max) {
      return "text-red-600 bg-red-50";
    }
    return "text-green-600 bg-green-50";
  };

  const getPHStatus = (ph: number): string => {
    if (ph < 6) return "Too Acidic";
    if (ph > 7.5) return "Too Alkaline";
    return "Optimal";
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-green-600 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">
              {t("soilTest", displayLanguage) || "Soil Test"}
            </h2>
            <p className="text-green-100 text-sm">
              {new Date(test.testDate).toLocaleDateString(
                displayLanguage === "hi"
                  ? "hi-IN"
                  : displayLanguage === "bn"
                    ? "bn-IN"
                    : "en-US"
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-green-700 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Language and Voice Controls */}
        <div className="bg-gray-50 p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4">
          {/* Language Selector */}
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-gray-600" />
            <select
              value={displayLanguage}
              onChange={(e) => setDisplayLanguage(e.target.value as Language)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {Object.entries(supportedLanguages).map(([code, { name }]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Voice Button */}
          {speakingSupported && (
            <button
              onClick={isSpeaking ? handleStop : handleSpeak}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isSpeaking
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-green-500 text-white hover:bg-green-600"
              }`}
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-5 h-5" />
                  {t("stop", displayLanguage) || "Stop"}
                </>
              ) : (
                <>
                  <Volume2 className="w-5 h-5" />
                  {t("speak", displayLanguage) || "Speak"}
                </>
              )}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* pH Reading */}
          <div className={`p-4 rounded-xl border-2 ${getStatusColor(test.pH, 6, 7.5)}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">pH</h3>
                <p className="text-sm opacity-75">
                  {t("soilAcidity", displayLanguage) || "Soil Acidity"}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{test.pH}</div>
                <div className="text-sm font-semibold">{getPHStatus(test.pH)}</div>
              </div>
            </div>
          </div>

          {/* Nutrients Grid */}
          <div>
            <h3 className="font-bold text-lg mb-3">
              {t("nutrients", displayLanguage) || "Nutrients"}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
              {test.nitrogen !== undefined && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-gray-600">
                    {t("nitrogen", displayLanguage) || "Nitrogen"}
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {test.nitrogen}
                  </p>
                  <p className="text-xs text-gray-500">kg/ha</p>
                </div>
              )}
              {test.phosphorus !== undefined && (
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-xs text-gray-600">
                    {t("phosphorus", displayLanguage) || "Phosphorus"}
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {test.phosphorus}
                  </p>
                  <p className="text-xs text-gray-500">kg/ha</p>
                </div>
              )}
              {test.potassium !== undefined && (
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-xs text-gray-600">
                    {t("potassium", displayLanguage) || "Potassium"}
                  </p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {test.potassium}
                  </p>
                  <p className="text-xs text-gray-500">kg/ha</p>
                </div>
              )}
              {test.organicMatter !== undefined && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs text-gray-600">
                    {t("organicMatter", displayLanguage) || "Organic Matter"}
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {test.organicMatter}
                  </p>
                  <p className="text-xs text-gray-500">%</p>
                </div>
              )}
              {test.moisture !== undefined && (
                <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-200">
                  <p className="text-xs text-gray-600">
                    {t("moisture", displayLanguage) || "Moisture"}
                  </p>
                  <p className="text-2xl font-bold text-cyan-600">
                    {test.moisture}
                  </p>
                  <p className="text-xs text-gray-500">%</p>
                </div>
              )}
            </div>
          </div>

          {/* Soil Texture */}
          {test.texture && (
            <div className="p-4 bg-gray-100 rounded-xl border border-gray-300">
              <h4 className="font-bold text-sm mb-1">
                {t("soilTexture", displayLanguage) || "Soil Texture"}
              </h4>
              <p className="text-lg font-semibold text-gray-700">
                {test.texture.charAt(0).toUpperCase() + test.texture.slice(1)}
              </p>
            </div>
          )}

          {/* Recommendations */}
          {test.recommendations && test.recommendations.length > 0 && (
            <div>
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                {t("recommendations", displayLanguage) || "Recommendations"}
              </h3>
              <div className="space-y-2">
                {test.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-gray-700"
                  >
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {test.notes && (
            <div>
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                {t("notes", displayLanguage) || "Notes"}
              </h3>
              <p className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-gray-700">
                {test.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
