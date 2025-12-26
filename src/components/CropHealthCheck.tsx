"use client";

import { useState, useEffect } from "react";
import {
    X,
    Thermometer,
    Droplets,
    CloudRain,
    Wind,
    AlertTriangle,
    CheckCircle,
    AlertCircle,
    Info,
    Activity,
    Sprout,
    Bug,
    Calendar,
    Volume2,
    RefreshCw,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { t } from "@/lib/i18n";
import type { Language } from "@/lib/i18n";
import type { CropHealthAnalysis } from "@/lib/cropHealth";

interface CropHealthCheckProps {
    cropName: string;
    plantedDate?: string;
    variety?: string;
    onClose: () => void;
    language: Language;
}

interface WeatherData {
    temp: number;
    humidity: number;
    rainfall: number;
    windSpeed: number;
    condition: string;
    description: string;
}

export default function CropHealthCheck({
    cropName,
    plantedDate,
    variety,
    onClose,
    language,
}: CropHealthCheckProps) {
    const { user } = useStore();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [analysis, setAnalysis] = useState<CropHealthAnalysis | null>(null);

    const fetchHealthCheck = async () => {
        if (!user?.lastLocation?.lat || !user?.lastLocation?.lon) {
            setError("Location not available. Please enable location in your profile.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/crop/health-check", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    cropName,
                    plantedDate,
                    lat: user.lastLocation.lat,
                    lon: user.lastLocation.lon,
                    language,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setWeather(data.weather);
                setAnalysis(data.analysis);
            } else {
                setError(data.error || "Failed to analyze crop health");
            }
        } catch (err) {
            console.error("Error fetching health check:", err);
            setError("Failed to connect. Please check your internet connection.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHealthCheck();
    }, []);

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
        utter.lang = langMap[language] || "en-US";
        synth.speak(utter);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "excellent":
            case "ideal":
                return "bg-green-100 text-green-800 border-green-300";
            case "good":
            case "favorable":
                return "bg-blue-100 text-blue-800 border-blue-300";
            case "moderate":
                return "bg-yellow-100 text-yellow-800 border-yellow-300";
            case "poor":
            case "unfavorable":
                return "bg-orange-100 text-orange-800 border-orange-300";
            case "critical":
                return "bg-red-100 text-red-800 border-red-300";
            default:
                return "bg-gray-100 text-gray-800 border-gray-300";
        }
    };

    const getRiskColor = (level: string) => {
        switch (level) {
            case "low":
            case "none":
                return "text-green-600";
            case "moderate":
                return "text-yellow-600";
            case "high":
            case "severe":
                return "text-orange-600";
            case "critical":
                return "text-red-600";
            default:
                return "text-gray-600";
        }
    };

    const getSummaryText = () => {
        if (!analysis || !weather) return "";
        return `${cropName} health check. Overall status: ${analysis.overallStatus}. 
    Weather: ${weather.temp} degrees, ${weather.humidity}% humidity. 
    Disease risk: ${analysis.diseaseRisk.level}. 
    Water stress: ${analysis.waterStress.level}. 
    ${analysis.recommendations[0] || "Continue regular monitoring."}`;
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Activity className="w-6 h-6" />
                        <div>
                            <h2 className="text-xl font-bold">{cropName}</h2>
                            <p className="text-green-100 text-sm">
                                {variety && `${variety} • `}
                                {plantedDate && `Planted: ${new Date(plantedDate).toLocaleDateString()}`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => speak(getSummaryText())}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                            title="Listen to summary"
                        >
                            <Volume2 className="w-5 h-5" />
                        </button>
                        <button
                            onClick={fetchHealthCheck}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-4 space-y-4">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
                            <p className="mt-4 text-gray-600 font-medium">
                                Analyzing crop health...
                            </p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
                            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                            <p className="text-red-800 font-semibold mb-2">{error}</p>
                            <button
                                onClick={fetchHealthCheck}
                                className="text-red-700 text-sm font-semibold hover:underline"
                            >
                                Try again
                            </button>
                        </div>
                    ) : analysis && weather ? (
                        <>
                            {/* Overall Status */}
                            <div
                                className={`p-4 rounded-xl border-2 ${getStatusColor(analysis.overallStatus)}`}
                            >
                                <div className="flex items-center gap-3">
                                    {analysis.overallStatus === "excellent" || analysis.overallStatus === "good" ? (
                                        <CheckCircle className="w-8 h-8" />
                                    ) : analysis.overallStatus === "moderate" ? (
                                        <AlertCircle className="w-8 h-8" />
                                    ) : (
                                        <AlertTriangle className="w-8 h-8" />
                                    )}
                                    <div>
                                        <h3 className="text-xl font-bold capitalize">
                                            {analysis.overallStatus} Health
                                        </h3>
                                        <p className="text-sm opacity-80">
                                            {analysis.weatherSuitability.message}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Current Weather */}
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <CloudRain className="w-5 h-5 text-blue-600" />
                                    Current Weather Conditions
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="bg-white rounded-lg p-3 text-center">
                                        <Thermometer className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                                        <p className="text-xs text-gray-600">Temperature</p>
                                        <p className="text-lg font-bold">{Math.round(weather.temp)}°C</p>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 text-center">
                                        <Droplets className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                                        <p className="text-xs text-gray-600">Humidity</p>
                                        <p className="text-lg font-bold">{weather.humidity}%</p>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 text-center">
                                        <CloudRain className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                                        <p className="text-xs text-gray-600">Rainfall</p>
                                        <p className="text-lg font-bold">{weather.rainfall.toFixed(1)}mm</p>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 text-center">
                                        <Wind className="w-5 h-5 text-gray-500 mx-auto mb-1" />
                                        <p className="text-xs text-gray-600">Wind</p>
                                        <p className="text-lg font-bold">{weather.windSpeed.toFixed(1)} m/s</p>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center justify-center gap-2 text-sm text-gray-600">
                                    <span className="capitalize">{weather.description}</span>
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(analysis.weatherSuitability.status)}`}
                                    >
                                        {analysis.weatherSuitability.status} for crop
                                    </span>
                                </div>
                            </div>

                            {/* Health Indicators */}
                            <div className="grid md:grid-cols-2 gap-4">
                                {/* Disease Risk */}
                                <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                                    <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                                        <AlertTriangle className={`w-5 h-5 ${getRiskColor(analysis.diseaseRisk.level)}`} />
                                        Disease Risk
                                    </h4>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span
                                            className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${analysis.diseaseRisk.level === "low"
                                                    ? "bg-green-100 text-green-800"
                                                    : analysis.diseaseRisk.level === "moderate"
                                                        ? "bg-yellow-100 text-yellow-800"
                                                        : analysis.diseaseRisk.level === "high"
                                                            ? "bg-orange-100 text-orange-800"
                                                            : "bg-red-100 text-red-800"
                                                }`}
                                        >
                                            {analysis.diseaseRisk.level}
                                        </span>
                                    </div>
                                    {analysis.diseaseRisk.factors.length > 0 && (
                                        <ul className="text-sm text-gray-600 space-y-1 mb-2">
                                            {analysis.diseaseRisk.factors.slice(0, 2).map((factor, i) => (
                                                <li key={i} className="flex items-start gap-1">
                                                    <span>•</span> {factor}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                        {analysis.diseaseRisk.recommendation}
                                    </p>
                                </div>

                                {/* Water Stress */}
                                <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                                    <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                                        <Droplets className={`w-5 h-5 ${getRiskColor(analysis.waterStress.level)}`} />
                                        Water Stress
                                    </h4>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span
                                            className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${analysis.waterStress.level === "none" || analysis.waterStress.level === "low"
                                                    ? "bg-green-100 text-green-800"
                                                    : analysis.waterStress.level === "moderate"
                                                        ? "bg-yellow-100 text-yellow-800"
                                                        : analysis.waterStress.level === "high"
                                                            ? "bg-orange-100 text-orange-800"
                                                            : "bg-red-100 text-red-800"
                                                }`}
                                        >
                                            {analysis.waterStress.level === "none" ? "No stress" : analysis.waterStress.level}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">{analysis.waterStress.indicator}</p>
                                    <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                        {analysis.waterStress.action}
                                    </p>
                                </div>

                                {/* Pest Risk */}
                                <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                                    <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                                        <Bug className={`w-5 h-5 ${getRiskColor(analysis.pestRisk.level)}`} />
                                        Pest Risk
                                    </h4>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span
                                            className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${analysis.pestRisk.level === "low"
                                                    ? "bg-green-100 text-green-800"
                                                    : analysis.pestRisk.level === "moderate"
                                                        ? "bg-yellow-100 text-yellow-800"
                                                        : "bg-orange-100 text-orange-800"
                                                }`}
                                        >
                                            {analysis.pestRisk.level}
                                        </span>
                                    </div>
                                    {analysis.pestRisk.pests.length > 0 && (
                                        <p className="text-sm text-gray-600 mb-2">
                                            Watch for: {analysis.pestRisk.pests.join(", ")}
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                        {analysis.pestRisk.prevention}
                                    </p>
                                </div>

                                {/* Growth Stage */}
                                <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                                    <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                                        <Sprout className="w-5 h-5 text-green-600" />
                                        Growth Stage
                                    </h4>
                                    <div className="mb-2">
                                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                                            {analysis.growthStage.stage}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">
                                        Day {analysis.growthStage.daysFromPlanting} since planting
                                    </p>
                                    {analysis.growthStage.daysToNextMilestone > 0 && (
                                        <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                            Next: {analysis.growthStage.nextMilestone} in ~{analysis.growthStage.daysToNextMilestone} days
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Harvest Readiness */}
                            <div className={`p-4 rounded-xl border-2 ${analysis.harvestReadiness.isReady
                                    ? "bg-green-50 border-green-300"
                                    : "bg-gray-50 border-gray-200"
                                }`}>
                                <div className="flex items-center gap-3">
                                    <Calendar className={`w-6 h-6 ${analysis.harvestReadiness.isReady ? "text-green-600" : "text-gray-500"}`} />
                                    <div>
                                        <h4 className="font-bold text-gray-900">
                                            {analysis.harvestReadiness.isReady
                                                ? "Ready for Harvest!"
                                                : `${analysis.harvestReadiness.daysToHarvest} days to harvest`
                                            }
                                        </h4>
                                        <p className="text-sm text-gray-600">
                                            Estimated harvest: {analysis.harvestReadiness.estimatedDate}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Alerts */}
                            {analysis.alerts.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5 text-orange-500" />
                                        Alerts & Notifications
                                    </h4>
                                    {analysis.alerts.map((alert, index) => (
                                        <div
                                            key={index}
                                            className={`p-3 rounded-lg border-2 flex items-start gap-2 ${alert.type === "danger"
                                                    ? "bg-red-50 border-red-200 text-red-800"
                                                    : alert.type === "warning"
                                                        ? "bg-orange-50 border-orange-200 text-orange-800"
                                                        : "bg-blue-50 border-blue-200 text-blue-800"
                                                }`}
                                        >
                                            {alert.type === "danger" ? (
                                                <AlertTriangle className="w-5 h-5 shrink-0" />
                                            ) : alert.type === "warning" ? (
                                                <AlertCircle className="w-5 h-5 shrink-0" />
                                            ) : (
                                                <Info className="w-5 h-5 shrink-0" />
                                            )}
                                            <span className="text-sm font-medium">{alert.message}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Recommendations */}
                            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                                <h4 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5" />
                                    Recommended Actions
                                </h4>
                                <ul className="space-y-2">
                                    {analysis.recommendations.map((rec, index) => (
                                        <li
                                            key={index}
                                            className="flex items-start gap-2 text-sm text-green-800"
                                        >
                                            <span className="w-5 h-5 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                                                {index + 1}
                                            </span>
                                            {rec}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
