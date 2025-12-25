"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Calendar, AlertCircle } from "lucide-react";
import { useStore } from "@/store/useStore";
import { t } from "@/lib/i18n";
import Link from "next/link";
import DiagnosisResult from "@/components/DiagnosisResult";

export default function HistoryPage() {
  const { user, language } = useStore();
  interface DiagnosisItem {
    id: string;
    crop?: string;
    disease?: {
      name: string;
      scientificName?: string;
      confidence: number;
      severity: "low" | "moderate" | "high" | "critical";
    } | null;
    inputType: string;
    timestamp: string;
    severity?: "low" | "moderate" | "high" | "critical";
  }

  interface FullDiagnosis {
    id: string;
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
    inputType: string;
    inputData?: string;
    imageUrl?: string;
    timestamp: string;
    weather?: {
      temp?: number;
      humidity?: number;
      rainfall?: number;
    };
  }

  interface Stats {
    total: number;
    diseases: Record<string, number>;
    mostCommonDisease: string | null;
  }

  const [diagnoses, setDiagnoses] = useState<DiagnosisItem[]>([]);
  const [selectedDiagnosis, setSelectedDiagnosis] =
    useState<FullDiagnosis | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchHistory();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchHistory = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/history?userId=${user.id}`);
      const data = await response.json();
      if (data.success) {
        setDiagnoses(data.diagnoses);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDiagnosisDetails = async (id: string) => {
    try {
      const response = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diagnosisId: id }),
      });
      const data = await response.json();
      if (data.success) {
        setSelectedDiagnosis(data.diagnosis);
      }
    } catch (error) {
      console.error("Error fetching diagnosis details:", error);
    }
  };

  const severityColors = {
    low: "bg-green-100 text-green-800",
    moderate: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-800",
  };

  if (selectedDiagnosis) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => setSelectedDiagnosis(null)}
            className="text-green-700 font-semibold flex items-center gap-2 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            {t("back", language)}
          </button>
          <DiagnosisResult diagnosis={selectedDiagnosis} language={language} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href="/"
          className="text-green-700 font-semibold flex items-center gap-2 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          {t("back", language)}
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          {t("myHistory", language)}
        </h1>

        {!user?.id ? (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 text-center">
            <p className="text-yellow-800">{t("noHistory", language)}</p>
            <Link
              href="/profile"
              className="mt-4 inline-block text-green-700 font-semibold"
            >
              Create Profile →
            </Link>
          </div>
        ) : loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
          </div>
        ) : diagnoses.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">{t("noHistory", language)}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Stats */}
            {stats && (
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h2 className="font-semibold text-gray-900 mb-4">Statistics</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Diagnoses</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.total}
                    </p>
                  </div>
                  {stats.mostCommonDisease && (
                    <div>
                      <p className="text-sm text-gray-600">Most Common</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {stats.mostCommonDisease}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Diagnosis List */}
            {diagnoses.map((diagnosis) => (
              <button
                key={diagnosis.id}
                onClick={() => fetchDiagnosisDetails(diagnosis.id)}
                className="w-full bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all text-left"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {diagnosis.crop}
                    </h3>
                    {diagnosis.disease && (
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-gray-700">
                          {diagnosis.disease.name}
                        </span>
                        {diagnosis.severity && (
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              severityColors[
                                diagnosis.severity as keyof typeof severityColors
                              ] || ""
                            }`}
                          >
                            {t(diagnosis.severity, language)}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      {new Date(diagnosis.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                  <AlertCircle className="w-6 h-6 text-gray-400" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
