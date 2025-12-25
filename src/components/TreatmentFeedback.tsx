"use client";

import { useState } from "react";
import { CheckCircle, XCircle, AlertCircle, MessageSquare } from "lucide-react";
import { t } from "@/lib/i18n";
import type { Language } from "@/lib/i18n";

interface TreatmentFeedbackProps {
  diagnosisId: string;
  language: Language;
  onFeedbackSubmitted?: () => void;
}

export default function TreatmentFeedback({
  diagnosisId,
  language,
  onFeedbackSubmitted,
}: TreatmentFeedbackProps) {
  const [feedback, setFeedback] = useState<"worked" | "partial" | "didnt_work" | null>(
    null
  );
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!feedback) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/diagnosis/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagnosisId,
          feedback,
          notes,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSubmitted(true);
        if (onFeedbackSubmitted) {
          onFeedbackSubmitted();
        }
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center">
        <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
        <p className="text-green-800 font-semibold">
          {t("thankYouFeedback", language) ||
            "Thank you for your feedback! This helps other farmers."}
        </p>
      </div>
    );
  }

  const labels = {
    hi: {
      title: "क्या उपचार काम किया?",
      worked: "हाँ, काम किया",
      partial: "आंशिक रूप से",
      didntWork: "नहीं, काम नहीं किया",
      notes: "अतिरिक्त नोट्स (वैकल्पिक)",
      submit: "सबमिट करें",
    },
    bn: {
      title: "চিকিত্সা কাজ করেছে?",
      worked: "হ্যাঁ, কাজ করেছে",
      partial: "আংশিকভাবে",
      didntWork: "না, কাজ করেনি",
      notes: "অতিরিক্ত নোট (ঐচ্ছিক)",
      submit: "জমা দিন",
    },
    en: {
      title: "Did the treatment work?",
      worked: "Yes, it worked",
      partial: "Partially",
      didntWork: "No, it didn't work",
      notes: "Additional notes (optional)",
      submit: "Submit",
    },
  };

  const t_labels = labels[language];

  return (
    <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-gray-600" />
        <h3 className="font-bold text-gray-900">{t_labels.title}</h3>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setFeedback("worked")}
            className={`p-4 rounded-xl border-2 transition-all ${
              feedback === "worked"
                ? "bg-green-100 border-green-500"
                : "bg-gray-50 border-gray-300 hover:border-green-300"
            }`}
          >
            <CheckCircle
              className={`w-8 h-8 mx-auto mb-2 ${
                feedback === "worked" ? "text-green-600" : "text-gray-400"
              }`}
            />
            <p className="text-sm font-semibold">{t_labels.worked}</p>
          </button>

          <button
            onClick={() => setFeedback("partial")}
            className={`p-4 rounded-xl border-2 transition-all ${
              feedback === "partial"
                ? "bg-yellow-100 border-yellow-500"
                : "bg-gray-50 border-gray-300 hover:border-yellow-300"
            }`}
          >
            <AlertCircle
              className={`w-8 h-8 mx-auto mb-2 ${
                feedback === "partial" ? "text-yellow-600" : "text-gray-400"
              }`}
            />
            <p className="text-sm font-semibold">{t_labels.partial}</p>
          </button>

          <button
            onClick={() => setFeedback("didnt_work")}
            className={`p-4 rounded-xl border-2 transition-all ${
              feedback === "didnt_work"
                ? "bg-red-100 border-red-500"
                : "bg-gray-50 border-gray-300 hover:border-red-300"
            }`}
          >
            <XCircle
              className={`w-8 h-8 mx-auto mb-2 ${
                feedback === "didnt_work" ? "text-red-600" : "text-gray-400"
              }`}
            />
            <p className="text-sm font-semibold">{t_labels.didntWork}</p>
          </button>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t_labels.notes}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 resize-none"
            rows={3}
            placeholder="Share your experience..."
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!feedback || submitting}
          className="w-full bg-green-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Submitting..." : t_labels.submit}
        </button>
      </div>
    </div>
  );
}

