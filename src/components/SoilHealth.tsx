"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Droplets,
  Leaf,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Volume2,
  VolumeX,
  Globe,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { t } from "@/lib/i18n";
import type { Language } from "@/lib/i18n";
import SoilTestDetail from "./SoilTestDetail";

interface SoilTestResult {
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
}

interface CropRecommendation {
  crop: string;
  suitability: "excellent" | "good" | "moderate" | "poor";
  reason: string;
  expectedYield?: string;
  plantingSeason?: string;
}

interface SoilImprovementSuggestion {
  action: string;
  priority: "high" | "medium" | "low";
  description: string;
  materials?: string[];
  cost?: number;
  timeline?: string;
}

interface SoilHealthProps {
  language: Language;
  farmId?: string;
}

export default function SoilHealth({ language, farmId }: SoilHealthProps) {
  const { user } = useStore();
  const [soilTests, setSoilTests] = useState<SoilTestResult[]>([]);
  const [recommendations, setRecommendations] = useState<CropRecommendation[]>(
    []
  );
  const [improvements, setImprovements] = useState<SoilImprovementSuggestion[]>(
    []
  );
  const [overallHealth, setOverallHealth] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<SoilTestResult | null>(null);
  const [displayLanguage, setDisplayLanguage] = useState<Language>(language);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [formData, setFormData] = useState({
    pH: "",
    nitrogen: "",
    phosphorus: "",
    potassium: "",
    organicMatter: "",
    moisture: "",
    texture: "loamy",
  });

  const fetchSoilTests = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(
        `/api/soil/test?userId=${user.id}${farmId ? `&farmId=${farmId}` : ""}`
      );
      const data = await response.json();
      if (data.success) {
        setSoilTests(data.soilTests || []);
      }
    } catch (error) {
      console.error("Error fetching soil tests:", error);
    }
  }, [user?.id, farmId]);

  const fetchRecommendations = useCallback(
    async (lang: Language) => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const response = await fetch(
          `/api/soil/recommendations?userId=${user.id}${
            farmId ? `&farmId=${farmId}` : ""
          }&language=${lang}`
        );
        const data = await response.json();
        if (data.success) {
          setRecommendations(data.recommendations || []);
          setImprovements(data.improvements || []);
          setOverallHealth(data.overallHealth || "");
          setSummary(data.summary || "");
        }
      } catch (error) {
        console.error("Error fetching recommendations:", error);
      } finally {
        setLoading(false);
      }
    },
    [user?.id, farmId]
  );

  useEffect(() => {
    if (user?.id) {
      fetchSoilTests();
      fetchRecommendations(displayLanguage);
    }
  }, [user?.id, farmId, displayLanguage, fetchSoilTests, fetchRecommendations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setLoading(true);
    try {
      const response = await fetch("/api/soil/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          farmId,
          pH: parseFloat(formData.pH),
          nitrogen: formData.nitrogen
            ? parseFloat(formData.nitrogen)
            : undefined,
          phosphorus: formData.phosphorus
            ? parseFloat(formData.phosphorus)
            : undefined,
          potassium: formData.potassium
            ? parseFloat(formData.potassium)
            : undefined,
          organicMatter: formData.organicMatter
            ? parseFloat(formData.organicMatter)
            : undefined,
          moisture: formData.moisture
            ? parseFloat(formData.moisture)
            : undefined,
          texture: formData.texture,
          language,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSoilTests([data.soilTest, ...soilTests]);
        setRecommendations(data.analysis.recommendations || []);
        setImprovements(data.analysis.improvements || []);
        setOverallHealth(data.analysis.overallHealth || "");
        setSummary(data.analysis.summary || "");
        setShowForm(false);
        setFormData({
          pH: "",
          nitrogen: "",
          phosphorus: "",
          potassium: "",
          organicMatter: "",
          moisture: "",
          texture: "loamy",
        });
      }
    } catch (error) {
      console.error("Error submitting soil test:", error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case "excellent":
        return "bg-green-100 text-green-800 border-green-300";
      case "good":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "fair":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "poor":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getSuitabilityColor = (suitability: string) => {
    switch (suitability) {
      case "excellent":
        return "text-green-700";
      case "good":
        return "text-blue-700";
      case "moderate":
        return "text-yellow-700";
      case "poor":
        return "text-red-700";
      default:
        return "text-gray-700";
    }
  };

  if (!user) {
    return null;
  }

  const speak = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const langMap: Record<Language, string> = {
      hi: "hi-IN",
      bn: "bn-IN",
      en: "en-US",
    };
    utter.lang = langMap[displayLanguage] || "en-US";
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    utterRef.current = utter;
    setIsSpeaking(true);
    synth.speak(utter);
  };

  const stopSpeaking = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const testSummaryText = (test: SoilTestResult | null) => {
    if (!test) return "";
    const recs = (test.recommendations || []).slice(0, 3).join("; ");
    return `Soil test on ${new Date(test.testDate).toLocaleDateString()}. pH ${
      test.pH
    }. Nitrogen ${test.nitrogen || "NA"}, Phosphorus ${
      test.phosphorus || "NA"
    }, Potassium ${test.potassium || "NA"}. Recommendations: ${
      recs || "none"
    }.`;
  };

  const handleOpenDetail = (test: SoilTestResult) => {
    setSelectedTest(test);
    setDetailOpen(true);
  };

  const languageOptions: { code: Language; label: string }[] = [
    { code: "en", label: "English" },
    { code: "hi", label: "हिन्दी" },
    { code: "bn", label: "বাংলা" },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Droplets className="w-6 h-6 text-green-600" />
            {t("soilHealth", displayLanguage) || "Soil Health"}
          </h3>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">
              {t("language", displayLanguage) || "Lang"}
            </label>
            <select
              value={displayLanguage}
              onChange={(e) => setDisplayLanguage(e.target.value as Language)}
              className="text-sm border rounded-lg px-2 py-1"
            >
              {languageOptions.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isSpeaking ? (
            <button
              onClick={() =>
                speak(testSummaryText(selectedTest || soilTests[0] || null))
              }
              className="p-2 bg-green-50 text-green-700 rounded-full hover:bg-green-100"
              title="Play summary"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={stopSpeaking}
              className="p-2 bg-red-50 text-red-700 rounded-full hover:bg-red-100"
              title="Stop"
            >
              <VolumeX className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors text-sm"
          >
            {showForm
              ? t("cancel", displayLanguage)
              : t("addSoilTest", displayLanguage) || "Add Soil Test"}
          </button>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-gray-50 rounded-xl p-4 space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                pH Level *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="14"
                value={formData.pH}
                onChange={(e) =>
                  setFormData({ ...formData, pH: e.target.value })
                }
                required
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                placeholder="6.5"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Texture
              </label>
              <select
                value={formData.texture}
                onChange={(e) =>
                  setFormData({ ...formData, texture: e.target.value })
                }
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
              >
                <option value="sandy">Sandy</option>
                <option value="loamy">Loamy</option>
                <option value="clay">Clay</option>
                <option value="silty">Silty</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Nitrogen (kg/ha)
              </label>
              <input
                type="number"
                value={formData.nitrogen}
                onChange={(e) =>
                  setFormData({ ...formData, nitrogen: e.target.value })
                }
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                placeholder="250"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Phosphorus (kg/ha)
              </label>
              <input
                type="number"
                value={formData.phosphorus}
                onChange={(e) =>
                  setFormData({ ...formData, phosphorus: e.target.value })
                }
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                placeholder="25"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Potassium (kg/ha)
              </label>
              <input
                type="number"
                value={formData.potassium}
                onChange={(e) =>
                  setFormData({ ...formData, potassium: e.target.value })
                }
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                placeholder="150"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Organic Matter (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.organicMatter}
                onChange={(e) =>
                  setFormData({ ...formData, organicMatter: e.target.value })
                }
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                placeholder="2.5"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading
              ? t("analyzing", language) + "..."
              : t("analyze", language) || "Analyze Soil"}
          </button>
        </form>
      )}

      {overallHealth && (
        <div
          className={`p-4 rounded-xl border-2 ${getHealthColor(overallHealth)}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5" />
            <span className="font-bold text-lg">
              {t("overallHealth", language) || "Overall Health"}:{" "}
              {overallHealth.toUpperCase()}
            </span>
          </div>
          {summary && <p className="text-sm mt-2">{summary}</p>}
        </div>
      )}

      {recommendations.length > 0 && (
        <div>
          <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Leaf className="w-5 h-5 text-green-600" />
            {t("cropRecommendations", language) || "Crop Recommendations"}
          </h4>
          <div className="space-y-3">
            {recommendations.map((rec, i) => (
              <div
                key={i}
                className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <h5 className="font-bold text-lg text-gray-900">
                    {rec.crop}
                  </h5>
                  <span
                    className={`font-semibold ${getSuitabilityColor(
                      rec.suitability
                    )}`}
                  >
                    {rec.suitability.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2">{rec.reason}</p>
                {rec.expectedYield && (
                  <p className="text-xs text-gray-600">
                    {t("expectedYield", language) || "Expected Yield"}:{" "}
                    {rec.expectedYield}
                  </p>
                )}
                {rec.plantingSeason && (
                  <p className="text-xs text-gray-600">
                    {t("plantingSeason", language) || "Best Season"}:{" "}
                    {rec.plantingSeason}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {improvements.length > 0 && (
        <div>
          <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            {t("soilImprovements", language) || "Soil Improvement Suggestions"}
          </h4>
          <div className="space-y-3">
            {improvements.map((improvement, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl border-2 ${
                  improvement.priority === "high"
                    ? "bg-red-50 border-red-200"
                    : improvement.priority === "medium"
                    ? "bg-yellow-50 border-yellow-200"
                    : "bg-blue-50 border-blue-200"
                }`}
              >
                <div className="flex items-start gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h5 className="font-bold text-gray-900">
                      {improvement.action}
                    </h5>
                    <span className="text-xs text-gray-600">
                      {t("priority", language) || "Priority"}:{" "}
                      {improvement.priority}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-2">
                  {improvement.description}
                </p>
                {improvement.materials && improvement.materials.length > 0 && (
                  <p className="text-xs text-gray-600">
                    {t("materials", language) || "Materials"}:{" "}
                    {improvement.materials.join(", ")}
                  </p>
                )}
                {improvement.cost && (
                  <p className="text-xs text-gray-600">
                    {t("estimatedCost", language) || "Estimated Cost"}: ₹
                    {improvement.cost}
                  </p>
                )}
                {improvement.timeline && (
                  <p className="text-xs text-gray-600">
                    {t("timeline", language) || "Timeline"}:{" "}
                    {improvement.timeline}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {soilTests.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-gray-900">
              {t("testHistory", language) || "Test History"}
            </h4>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-600" />
              <select
                value={displayLanguage}
                onChange={(e) => setDisplayLanguage(e.target.value as Language)}
                className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:border-green-500"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="bn">বাংলা</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            {soilTests.slice(0, 3).map((test) => (
              <button
                key={test.id}
                onClick={() => handleOpenDetail(test)}
                className="w-full bg-gray-50 hover:bg-gray-100 rounded-lg p-3 text-sm text-left transition-colors border border-gray-200 cursor-pointer"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold">pH: {test.pH}</span>
                  <span className="text-gray-600">
                    {new Date(test.testDate).toLocaleDateString()}
                  </span>
                </div>
                {test.nitrogen && (
                  <p className="text-xs text-gray-600 mt-1">
                    N: {test.nitrogen} | P: {test.phosphorus || "N/A"} | K:{" "}
                    {test.potassium || "N/A"}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {detailOpen && selectedTest && (
        <SoilTestDetail
          test={selectedTest}
          onClose={() => setDetailOpen(false)}
          language={displayLanguage}
        />
      )}
    </div>
  );
}

