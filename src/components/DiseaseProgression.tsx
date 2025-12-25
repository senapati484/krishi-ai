"use client";

import { useState, useEffect } from "react";
import { Calendar, Camera, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { t } from "@/lib/i18n";
import type { Language } from "@/lib/i18n";

interface ProgressionEntry {
  id: string;
  date: string;
  imageUrl?: string;
  severity: "low" | "moderate" | "high" | "critical";
  notes?: string;
}

interface DiseaseProgressionProps {
  progressionId: string;
  crop: string;
  disease: string;
  language: Language;
  userId: string;
}

export default function DiseaseProgression({
  progressionId,
  crop,
  disease,
  language,
  userId,
}: DiseaseProgressionProps) {
  const [entries, setEntries] = useState<ProgressionEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgression();
  }, [progressionId]);

  const fetchProgression = async () => {
    try {
      const response = await fetch(
        `/api/diagnosis/progression?progressionId=${progressionId}`
      );
      const data = await response.json();
      if (data.success && data.entries) {
        setEntries(data.entries);
      }
    } catch (error) {
      console.error("Error fetching progression:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityTrend = (index: number) => {
    if (index === 0) return null;
    const current = entries[index];
    const previous = entries[index - 1];

    const severityOrder = { low: 1, moderate: 2, high: 3, critical: 4 };
    const currentLevel = severityOrder[current.severity];
    const previousLevel = severityOrder[previous.severity];

    if (currentLevel < previousLevel) return "improving";
    if (currentLevel > previousLevel) return "worsening";
    return "stable";
  };

  const severityColors = {
    low: "bg-green-100 text-green-800 border-green-300",
    moderate: "bg-yellow-100 text-yellow-800 border-yellow-300",
    high: "bg-orange-100 text-orange-800 border-orange-300",
    critical: "bg-red-100 text-red-800 border-red-300",
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-green-600 border-t-transparent"></div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-gray-50 rounded-xl p-8 text-center">
        <p className="text-gray-600">
          {t("noProgressionData", language) || "No progression data yet"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 border-2 border-green-200">
        <h3 className="font-bold text-lg text-gray-900 mb-2">
          {crop} - {disease}
        </h3>
        <p className="text-sm text-gray-600">
          {t("trackingSince", language) || "Tracking since"}:{" "}
          {new Date(entries[0].date).toLocaleDateString()}
        </p>
      </div>

      <div className="space-y-4">
        {entries.map((entry, index) => {
          const trend = getSeverityTrend(index);
          return (
            <div
              key={entry.id}
              className="bg-white rounded-xl p-4 border-2 border-gray-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-700">
                    {new Date(entry.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {trend === "improving" && (
                    <TrendingDown className="w-5 h-5 text-green-600" />
                  )}
                  {trend === "worsening" && (
                    <TrendingUp className="w-5 h-5 text-red-600" />
                  )}
                  {trend === "stable" && (
                    <Minus className="w-5 h-5 text-gray-400" />
                  )}
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      severityColors[entry.severity]
                    }`}
                  >
                    {t(entry.severity, language)}
                  </span>
                </div>
              </div>

              {entry.imageUrl && (
                <div className="mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={entry.imageUrl}
                    alt="Progression"
                    className="w-full rounded-lg max-h-48 object-cover"
                  />
                </div>
              )}

              {entry.notes && (
                <p className="text-sm text-gray-700">{entry.notes}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

