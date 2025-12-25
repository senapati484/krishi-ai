"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { t } from "@/lib/i18n";
import type { Language } from "@/lib/i18n";
import Link from "next/link";

interface DiseaseCard {
  name: string;
  commonName: string;
  symptoms: string[];
  quickFix: string;
  severity: "low" | "moderate" | "high";
}

// Common diseases by crop type
const commonDiseases: Record<string, DiseaseCard[]> = {
  tomato: [
    {
      name: "Early Blight",
      commonName: "Early Blight",
      symptoms: ["Brown spots with rings", "Yellow leaves", "Lower leaves affected first"],
      quickFix: "Remove affected leaves, apply copper-based fungicide",
      severity: "moderate",
    },
    {
      name: "Late Blight",
      commonName: "Late Blight",
      symptoms: ["Dark spots on leaves", "White mold", "Rapid spread"],
      quickFix: "Apply fungicide immediately, improve air circulation",
      severity: "high",
    },
    {
      name: "Bacterial Spot",
      commonName: "Bacterial Spot",
      symptoms: ["Small dark spots", "Leaf drop", "Fruit spots"],
      quickFix: "Use copper-based bactericide, avoid overhead watering",
      severity: "moderate",
    },
  ],
  rice: [
    {
      name: "Blast",
      commonName: "Rice Blast",
      symptoms: ["Diamond-shaped lesions", "White to gray centers", "Leaf death"],
      quickFix: "Apply tricyclazole fungicide, use resistant varieties",
      severity: "high",
    },
    {
      name: "Brown Spot",
      commonName: "Brown Spot",
      symptoms: ["Brown oval spots", "Yellow leaves", "Reduced yield"],
      quickFix: "Apply mancozeb fungicide, improve soil nutrition",
      severity: "moderate",
    },
  ],
  wheat: [
    {
      name: "Rust",
      commonName: "Wheat Rust",
      symptoms: ["Orange pustules", "Yellow streaks", "Stunted growth"],
      quickFix: "Apply propiconazole, use resistant varieties",
      severity: "high",
    },
    {
      name: "Powdery Mildew",
      commonName: "Powdery Mildew",
      symptoms: ["White powdery coating", "Yellow leaves", "Reduced yield"],
      quickFix: "Apply sulfur-based fungicide, improve air circulation",
      severity: "moderate",
    },
  ],
};

interface QuickDiagnosisCardsProps {
  language: Language;
  cropType?: string;
}

export default function QuickDiagnosisCards({
  language,
  cropType = "tomato",
}: QuickDiagnosisCardsProps) {
  const diseases = commonDiseases[cropType.toLowerCase()] || commonDiseases.tomato;
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextCard = () => {
    setCurrentIndex((prev) => (prev + 1) % diseases.length);
  };

  const prevCard = () => {
    setCurrentIndex((prev) => (prev - 1 + diseases.length) % diseases.length);
  };

  const currentDisease = diseases[currentIndex];

  const severityColors = {
    low: "bg-green-100 text-green-800 border-green-300",
    moderate: "bg-yellow-100 text-yellow-800 border-yellow-300",
    high: "bg-red-100 text-red-800 border-red-300",
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">
          {t("quickDiagnosis", language) || "Quick Diagnosis"}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={prevCard}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="text-sm text-gray-600">
            {currentIndex + 1} / {diseases.length}
          </span>
          <button
            onClick={nextCard}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div
          className={`p-4 rounded-xl border-2 ${
            severityColors[currentDisease.severity]
          }`}
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h4 className="font-bold text-lg mb-2">{currentDisease.name}</h4>
              <p className="text-sm opacity-90">{currentDisease.commonName}</p>
            </div>
          </div>
        </div>

        <div>
          <h5 className="font-semibold text-gray-900 mb-2">
            {t("symptoms", language) || "Symptoms"}:
          </h5>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            {currentDisease.symptoms.map((symptom, i) => (
              <li key={i}>{symptom}</li>
            ))}
          </ul>
        </div>

        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
          <h5 className="font-semibold text-green-900 mb-2">
            {t("quickFix", language) || "Quick Fix"}:
          </h5>
          <p className="text-sm text-green-800">{currentDisease.quickFix}</p>
        </div>

        <button
          onClick={() => {
            // Scroll to top and trigger scan (this will be handled by parent)
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="w-full text-center bg-green-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-green-700 transition-colors"
        >
          {t("scanMyCrop", language) || "Scan My Crop"}
        </button>
      </div>
    </div>
  );
}

