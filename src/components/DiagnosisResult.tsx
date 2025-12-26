"use client";

import {
  Share2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Clock,
  Volume2,
  VolumeX,
  Globe,
} from "lucide-react";
import { t } from "@/lib/i18n";
import type { Language } from "@/lib/i18n";
import TreatmentFeedback from "./TreatmentFeedback";
import DiseaseProgression from "./DiseaseProgression";
import VideoTutorials from "./VideoTutorials";
import { useState, useMemo, useEffect } from "react";
import { useStore } from "@/store/useStore";

interface DiagnosisResultProps {
  diagnosis: {
    id?: string;
    crop: string;
    disease: {
      name: string;
      scientificName?: string;
      confidence: number;
      severity: "low" | "moderate" | "high" | "critical";
    } | null;
    advice: {
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
    };
    symptoms?: string[];
    affectedArea?: string;
    timestamp?: string;
    progressionId?: string;
    treatmentEffectiveness?: {
      feedback: "worked" | "partial" | "didnt_work" | null;
    };
  };
  language: Language;
  onShare?: () => void;
}

export default function DiagnosisResult({
  diagnosis,
  language,
  onShare,
}: DiagnosisResultProps) {
  const { user } = useStore();
  const [showProgression, setShowProgression] = useState(false);
  const [nowTs, setNowTs] = useState<number | null>(null);
  const [displayLanguage, setDisplayLanguage] = useState<Language>(language);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Capture time after mount to avoid hydration mismatch
  useEffect(() => {
    const timer = setTimeout(() => setNowTs(Date.now()), 0);
    const interval = setInterval(() => setNowTs(Date.now()), 60000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  // Calculate if we should show feedback using useMemo to avoid recalculating unnecessarily
  const shouldShowFeedback = useMemo(() => {
    if (
      !diagnosis.timestamp ||
      diagnosis.treatmentEffectiveness?.feedback ||
      nowTs === null
    )
      return false;
    const diagnosisDate = new Date(diagnosis.timestamp);
    const daysSince = (nowTs - diagnosisDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince >= 7;
  }, [diagnosis.timestamp, diagnosis.treatmentEffectiveness?.feedback, nowTs]);

  // Handle voice synthesis
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
    setIsSpeaking(true);
    synth.speak(utter);
  };

  const stopSpeaking = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const diagnosisSummaryText = () => {
    const disease = diagnosis.disease?.name || "No disease detected";
    const severity = diagnosis.disease?.severity || "N/A";
    const conf = diagnosis.disease
      ? Math.round(diagnosis.disease.confidence * 100) + "%"
      : "N/A";
    const symptoms = (diagnosis.symptoms || []).slice(0, 5).join(", ");
    const actions = (diagnosis.advice.immediate || []).slice(0, 3).join("; ");
    return `Crop ${diagnosis.crop}. Disease ${disease}. Severity ${severity}. Confidence ${conf}. Symptoms ${symptoms}. Immediate actions ${actions}.`;
  };

  const canShowProgression = diagnosis.progressionId !== undefined;
  const severityColors = {
    low: "bg-green-100 text-green-800 border-green-300",
    moderate: "bg-yellow-100 text-yellow-800 border-yellow-300",
    high: "bg-orange-100 text-orange-800 border-orange-300",
    critical: "bg-red-100 text-red-800 border-red-300",
  };

  const severityIcons = {
    low: CheckCircle,
    moderate: Info,
    high: AlertTriangle,
    critical: XCircle,
  };

  const shareToWhatsApp = () => {
    const message = `
🌾 *Krishi AI Diagnosis*

Crop: ${diagnosis.crop}
${
  diagnosis.disease
    ? `Disease: ${diagnosis.disease.name}`
    : "No disease detected"
}
${diagnosis.disease ? `Severity: ${diagnosis.disease.severity}` : ""}
${
  diagnosis.disease
    ? `Confidence: ${Math.round(diagnosis.disease.confidence * 100)}%`
    : ""
}

${
  diagnosis.advice.immediate.length > 0
    ? `Immediate Actions:\n${diagnosis.advice.immediate
        .map((a, i) => `${i + 1}. ${a}`)
        .join("\n")}`
    : ""
}

${
  diagnosis.advice.treatment.length > 0
    ? `Treatment Options:\n${diagnosis.advice.treatment
        .map((t) => `- ${t.name} (${t.type}): ₹${t.cost}`)
        .join("\n")}`
    : ""
}
    `.trim();

    if (typeof window !== "undefined" && navigator.share) {
      navigator
        .share({
          title: "Krishi AI Diagnosis",
          text: message,
        })
        .catch(console.error);
    } else {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");
    }

    if (onShare) onShare();
  };

  return (
    <div className="space-y-6 p-6 bg-white rounded-2xl shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-start gap-3 flex-wrap">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">{diagnosis.crop}</h2>
          {diagnosis.disease && (
            <div className="mt-1 flex items-center gap-2">
              <span className="text-lg text-gray-700">
                {diagnosis.disease.name}
              </span>
              {diagnosis.disease.scientificName && (
                <span className="text-sm text-gray-500 italic">
                  ({diagnosis.disease.scientificName})
                </span>
              )}
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-600" />
              <select
                value={displayLanguage}
                onChange={(e) => setDisplayLanguage(e.target.value as Language)}
                className="text-sm border rounded-lg px-2 py-1 focus:outline-none focus:border-green-500"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="bn">বাংলা</option>
              </select>
            </div>
            {!isSpeaking ? (
              <button
                onClick={() => speak(diagnosisSummaryText())}
                className="p-2 rounded-full bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                title="Play summary"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={stopSpeaking}
                className="p-2 rounded-full bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                title="Stop"
              >
                <VolumeX className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onShare && (
            <button
              onClick={shareToWhatsApp}
              className="p-3 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Severity Badge */}
      {diagnosis.disease && (
        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 ${
            severityColors[diagnosis.disease.severity]
          }`}
        >
          {(() => {
            const Icon = severityIcons[diagnosis.disease.severity];
            return <Icon className="w-5 h-5" />;
          })()}
          <span className="font-semibold">
            {t(diagnosis.disease.severity, displayLanguage)} -{" "}
            {Math.round(diagnosis.disease.confidence * 100)}%
          </span>
        </div>
      )}

      {/* Symptoms */}
      {diagnosis.symptoms && diagnosis.symptoms.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Symptoms:</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            {diagnosis.symptoms.map((symptom, i) => (
              <li key={i}>{symptom}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Immediate Actions */}
      {diagnosis.advice.immediate.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              {t("immediateActions", displayLanguage)}
            </h3>
            {!isSpeaking ? (
              <button
                onClick={() => speak(diagnosis.advice.immediate.join(". "))}
                className="p-2 rounded-full bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                title="Read actions"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={stopSpeaking}
                className="p-2 rounded-full bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                title="Stop"
              >
                <VolumeX className="w-4 h-4" />
              </button>
            )}
          </div>
          <ol className="space-y-2">
            {diagnosis.advice.immediate.map((action, i) => (
              <li key={i} className="flex gap-3">
                <span className="shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                  {i + 1}
                </span>
                <span className="text-gray-700">{action}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Treatment Options */}
      {diagnosis.advice.treatment.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">
              {t("treatment", displayLanguage)}
            </h3>
            {!isSpeaking ? (
              <button
                onClick={() =>
                  speak(
                    diagnosis.advice.treatment
                      .map(
                        (t) =>
                          `${t.name}. ${t.dosage}. Cost ${t.cost} rupees. ${t.availability}`
                      )
                      .join(". ")
                  )
                }
                className="p-2 rounded-full bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                title="Read treatments"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={stopSpeaking}
                className="p-2 rounded-full bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                title="Stop"
              >
                <VolumeX className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="space-y-4">
            {diagnosis.advice.treatment.map((treatment, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl border-2 ${
                  treatment.type === "organic"
                    ? "bg-green-50 border-green-200"
                    : "bg-blue-50 border-blue-200"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-semibold text-gray-900">
                      {treatment.name}
                    </span>
                    <span
                      className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                        treatment.type === "organic"
                          ? "bg-green-200 text-green-800"
                          : "bg-blue-200 text-blue-800"
                      }`}
                    >
                      {t(treatment.type, displayLanguage)}
                    </span>
                  </div>
                  <span className="font-bold text-lg text-gray-900">
                    ₹{treatment.cost}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-1">{treatment.dosage}</p>
                <p className="text-xs text-gray-600">
                  {treatment.availability}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prevention */}
      {diagnosis.advice.prevention.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">
            {t("prevention", displayLanguage)}
          </h3>
          <ul className="space-y-2">
            {diagnosis.advice.prevention.map((tip, i) => (
              <li key={i} className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <span className="text-gray-700">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Expert Consult Warning */}
      {diagnosis.advice.expertConsultNeeded && (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
            <div>
              <h4 className="font-semibold text-red-900 mb-1">
                {t("expertNeeded", language)}
              </h4>
              <p className="text-sm text-red-700">
                Please consult a local agricultural expert for proper diagnosis
                and treatment.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Treatment Feedback - Show after 7 days */}
      {shouldShowFeedback && diagnosis.id && (
        <div className="mt-6">
          <TreatmentFeedback
            diagnosisId={diagnosis.id}
            language={language}
            onFeedbackSubmitted={() => {}}
          />
        </div>
      )}

      {/* Disease Progression Tracker */}
      {canShowProgression && diagnosis.progressionId && (
        <div className="mt-6">
          <button
            onClick={() => setShowProgression(!showProgression)}
            className="w-full flex items-center justify-between p-4 bg-blue-50 border-2 border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-900">
                {t("trackProgression", language) || "Track Disease Progression"}
              </span>
            </div>
            <span className="text-blue-600">{showProgression ? "−" : "+"}</span>
          </button>
          {showProgression && (
            <div className="mt-4">
              <DiseaseProgression
                progressionId={diagnosis.progressionId}
                crop={diagnosis.crop}
                disease={diagnosis.disease?.name || "Unknown"}
                language={language}
                userId={user?.id || "guest"}
              />
            </div>
          )}
        </div>
      )}

      {/* Video Tutorials with QR Code */}
      {diagnosis.disease && (
        <div className="mt-6">
          <VideoTutorials
            language={language}
            crop={diagnosis.crop}
            disease={diagnosis.disease.name}
            treatmentType={diagnosis.advice.treatment[0]?.type}
            showQR={true}
            diagnosisId={diagnosis.id}
          />
        </div>
      )}
    </div>
  );
}
