"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Plus,
  Calendar,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { t } from "@/lib/i18n";
import Link from "next/link";
import SoilHealth from "@/components/SoilHealth";

interface Crop {
  name: string;
  plantedDate?: string;
  variety?: string;
  status: "healthy" | "monitoring" | "diseased";
  lastCheck?: string;
}

export default function DashboardPage() {
  const { user, language } = useStore();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCrop, setShowAddCrop] = useState(false);
  const [newCrop, setNewCrop] = useState({
    name: "",
    plantedDate: "",
    variety: "",
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchCrops();
    }
  }, [user]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchCrops = async () => {
    try {
      const response = await fetch(`/api/farm?userId=${user?.id}`);
      const data = await response.json();
      if (data.success && data.farm?.crops) {
        setCrops(data.farm.crops);
      }
    } catch (error) {
      console.error("Error fetching crops:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCrop = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/farm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          crop: {
            name: newCrop.name,
            plantedDate: newCrop.plantedDate || undefined,
            variety: newCrop.variety || undefined,
            status: "healthy",
            lastCheck: new Date().toISOString(),
          },
        }),
      });

      const data = await response.json();
      if (data.success) {
        setCrops([...crops, data.crop]);
        setNewCrop({ name: "", plantedDate: "", variety: "" });
        setShowAddCrop(false);
      }
    } catch (error) {
      console.error("Error adding crop:", error);
    }
  };

  const statusColors = {
    healthy: "bg-green-100 text-green-800 border-green-300",
    monitoring: "bg-yellow-100 text-yellow-800 border-yellow-300",
    diseased: "bg-red-100 text-red-800 border-red-300",
  };

  const statusIcons = {
    healthy: CheckCircle,
    monitoring: AlertCircle,
    diseased: AlertCircle,
  };

  if (!mounted) {
    return null;
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

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {t("myFarm", language) || "My Farm"}
          </h1>
          <button
            onClick={() => setShowAddCrop(!showAddCrop)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            {t("addCrop", language) || "Add Crop"}
          </button>
        </div>

        {showAddCrop && (
          <form
            onSubmit={handleAddCrop}
            className="bg-white rounded-xl p-6 mb-6 shadow-lg border-2 border-gray-200"
          >
            <h3 className="font-bold text-lg mb-4">
              {t("addNewCrop", language) || "Add New Crop"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t("cropName", language) || "Crop Name"}
                </label>
                <input
                  type="text"
                  value={newCrop.name}
                  onChange={(e) =>
                    setNewCrop({ ...newCrop, name: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500"
                  placeholder="e.g., Tomato, Rice, Wheat"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("plantedDate", language) || "Planted Date"}
                  </label>
                  <input
                    type="date"
                    value={newCrop.plantedDate}
                    onChange={(e) =>
                      setNewCrop({ ...newCrop, plantedDate: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("variety", language) || "Variety"}
                  </label>
                  <input
                    type="text"
                    value={newCrop.variety}
                    onChange={(e) =>
                      setNewCrop({ ...newCrop, variety: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500"
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-green-700 transition-colors"
                >
                  {t("add", language) || "Add"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCrop(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                >
                  {t("cancel", language)}
                </button>
              </div>
            </div>
          </form>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
          </div>
        ) : crops.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-lg">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-4">
              {t("noCrops", language) || "No crops added yet"}
            </p>
            <button
              onClick={() => setShowAddCrop(true)}
              className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
            >
              {t("addFirstCrop", language) || "Add Your First Crop"}
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {crops.map((crop, index) => {
              const StatusIcon = statusIcons[crop.status] || AlertCircle;
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {crop.name}
                      </h3>
                      {crop.variety && (
                        <p className="text-sm text-gray-600">{crop.variety}</p>
                      )}
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                        statusColors[crop.status] || statusColors.healthy
                      }`}
                    >
                      <StatusIcon className="w-4 h-4" />
                      {t(crop.status, language) || crop.status}
                    </span>
                  </div>

                  {crop.plantedDate && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {t("planted", language) || "Planted"}:{" "}
                        {new Date(crop.plantedDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {crop.lastCheck && (
                    <div className="text-xs text-gray-500">
                      {t("lastCheck", language) || "Last check"}:{" "}
                      {new Date(crop.lastCheck).toLocaleDateString()}
                    </div>
                  )}

                  <Link
                    href="/"
                    className="mt-4 block w-full text-center bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors text-sm"
                  >
                    {t("checkHealth", language) || "Check Health"}
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {/* Soil Health Section */}
        <div className="mt-8">
          <SoilHealth language={language} />
        </div>
      </div>
    </div>
  );
}
