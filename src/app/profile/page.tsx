"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Save,
  MapPin,
  Mail,
  Bell,
  CheckCircle,
  XCircle,
  Send,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { t } from "@/lib/i18n";
import Link from "next/link";

export default function ProfilePage () {
  const { user, language, setUser, refreshUser } = useStore();
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    village: "",
    district: "",
    state: "",
    emailNotifications: true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string>("");

  // Fix hydration error by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
        email: user.email || "",
        village: user.location?.village || "",
        district: user.location?.district || "",
        state: user.location?.state || "",
        emailNotifications: user.emailNotifications !== false,
      });

      // Set verification status based on user's emailVerified field
      if (user.emailVerified === true) {
        setVerificationStatus("verified");
      } else if (user.email) {
        setVerificationStatus("pending");
      } else {
        setVerificationStatus("");
      }

      // Show location status
      if (
        user.lastLocation &&
        typeof user.lastLocation.lat === 'number' &&
        typeof user.lastLocation.lon === 'number'
      ) {
        setLocationStatus(
          `Location: ${user.lastLocation.lat.toFixed(4)}, ${user.lastLocation.lon.toFixed(4)}`
        );
      } else {
        setLocationStatus(
          "Location not set. Click a button below to set your location."
        );
      }
    }
  }, [user]);

  const requestLocation = () => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      setLocationStatus("Requesting location access...");
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch("/api/user/location", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: user?.id,
                lat: latitude,
                lon: longitude,
              }),
            });

            const data = await response.json();

            if (data.success && user) {
              // Update store with new location
              const updatedUser = {
                ...user,
                lastLocation: {
                  lat: latitude,
                  lon: longitude,
                  updatedAt: new Date().toISOString(),
                },
              };
              setUser(updatedUser);

              setLocationStatus(
                `Location updated: ${latitude.toFixed(
                  4
                )}, ${longitude.toFixed(4)}`
              );

              // Show success for a few seconds
              setTimeout(() => {
                setLocationStatus(
                  `Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
                );
              }, 3000);
            } else {
              const errorMsg = data.error || "Failed to update location";
              setLocationStatus(`Error: ${errorMsg}`);
              console.error("Location update error:", data);
            }
          } catch (error) {
            console.error("Error updating location:", error);
            setLocationStatus("Error: Network error updating location");
          }
        },
        (error) => {
          // Handle geolocation errors gracefully without console spam
          let errorMsg = "Location access denied. Please enable in browser settings.";

          if (error.code === error.PERMISSION_DENIED) {
            errorMsg = "Location permission denied. Please enable in browser settings.";
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMsg = "Unable to get location. Enable location access in browser settings or use test location below.";
          } else if (error.code === error.TIMEOUT) {
            errorMsg = "Location request timed out. Please try again.";
          }

          setLocationStatus(errorMsg);
        },
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 3600000 }
      );
    } else {
      setLocationStatus("Geolocation is not supported by your browser.");
    }
  };

  // Test location for development (India - Howrah, West Bengal)
  const useTestLocation = async () => {
    setLocationStatus("Setting test location...");
    try {
      const response = await fetch("/api/user/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          lat: 22.5958,
          lon: 88.2636,
        }),
      });

      const data = await response.json();

      if (data.success && user) {
        const updatedUser = {
          ...user,
          lastLocation: {
            lat: 22.5958,
            lon: 88.2636,
            updatedAt: new Date().toISOString(),
          },
        };
        setUser(updatedUser);
        setLocationStatus("✓ Test location set: Howrah, West Bengal (22.5958°N, 88.2636°E)");

        setTimeout(() => {
          setLocationStatus("Location: 22.5958, 88.2636 (Test)");
        }, 3000);
      } else {
        setLocationStatus("Error: Failed to set test location");
      }
    } catch (error) {
      setLocationStatus("Error: Network error setting location");
    }
  };

  const handleSendVerificationCode = async () => {
    if (!user?.id || !formData.email) return;

    setSendingCode(true);
    setVerificationStatus("");
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          email: formData.email,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setVerificationStatus("pending");
        setVerificationCode(""); // Clear any old code
        alert("Verification code sent to your email! Please check your inbox (and spam folder).\n\nThe code expires in 10 minutes.");
      } else {
        const errorMsg = data.error || "Failed to send verification code.";
        alert(errorMsg);
      }
    } catch (error) {
      console.error("Error sending verification code:", error);
      alert("Error sending verification code");
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!user?.id) return;

    // Trim and validate code
    const codeToVerify = verificationCode.trim().replace(/\s/g, ''); // Remove all spaces

    if (codeToVerify.length !== 6 || !/^\d{6}$/.test(codeToVerify)) {
      alert("Please enter a valid 6-digit code.");
      return;
    }

    setVerifying(true);
    try {
      console.log('Verifying code:', codeToVerify);

      const response = await fetch("/api/auth/verify-email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          code: codeToVerify,
        }),
      });

      const data = await response.json();
      console.log('Verification response:', data);

      if (data.success) {
        setVerificationStatus("verified");
        setVerificationCode("");

        // Refresh user data from server to persist emailVerified status
        await refreshUser();

        alert("✅ Email verified successfully!");
      } else {
        const errorMsg = data.error || "Invalid verification code";
        alert(errorMsg + "\n\nPlease check:\n1. Code is correct (6 digits)\n2. Code hasn't expired (10 minutes)\n3. Request a new code if needed");
        console.error('Verification failed:', data);
      }
    } catch (error) {
      console.error("Error verifying code:", error);
      alert("Error verifying code. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      const response = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user?.id,
          name: formData.name,
          phone: formData.phone,
          language,
          location: {
            village: formData.village,
            district: formData.district,
            state: formData.state,
          },
          emailNotifications: formData.emailNotifications,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Update user state with all fields including emailVerified
        setUser({
          ...user,
          ...data.user,
          emailVerified: data.user.emailVerified ?? user?.emailVerified ?? false,
        });

        // Update verification status based on saved emailVerified
        if (data.user.emailVerified === true) {
          setVerificationStatus("verified");
        } else if (data.user.email) {
          setVerificationStatus("pending");
        }

        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setSaving(false);
    }
  };

  // Prevent hydration error by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-linear-to-b from-green-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-green-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href="/"
          className="text-green-700 font-semibold flex items-center gap-2 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          {t("back", language)}
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          {t("myProfile", language)}
        </h1>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-lg p-6 space-y-6"
        >
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t("name", language)}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500"
              placeholder="Enter your name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500"
              placeholder="+91 1234567890"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t("location", language)}
            </label>
            <div className="space-y-3">
              <input
                type="text"
                value={formData.village}
                onChange={(e) =>
                  setFormData({ ...formData, village: e.target.value })
                }
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500"
                placeholder="Village"
              />
              <input
                type="text"
                value={formData.district}
                onChange={(e) =>
                  setFormData({ ...formData, district: e.target.value })
                }
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500"
                placeholder="District"
              />
              <input
                type="text"
                value={formData.state}
                onChange={(e) =>
                  setFormData({ ...formData, state: e.target.value })
                }
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500"
                placeholder="State"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Bell className="inline w-4 h-4 mr-2" />
              Email Notifications
            </label>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.emailNotifications}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    emailNotifications: e.target.checked,
                  })
                }
                className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">
                Receive weather alerts via email
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <MapPin className="inline w-4 h-4 mr-2" />
              Current Location
            </label>
            <div className="space-y-2">
              <p className="text-sm text-gray-600 mb-2">{locationStatus}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={requestLocation}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  Update Location
                </button>
                <button
                  type="button"
                  onClick={useTestLocation}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-xl font-semibold hover:bg-gray-600 transition-colors text-sm"
                >
                  Use Test Location
                </button>
              </div>
            </div>
          </div>

          {/* Email Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Mail className="inline w-4 h-4 mr-2" />
              Email Address
            </label>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500"
                  placeholder="your@email.com"
                />
                <button
                  type="button"
                  onClick={handleSendVerificationCode}
                  disabled={
                    sendingCode ||
                    !formData.email ||
                    verificationStatus === "verified"
                  }
                  className="px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {sendingCode ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {verificationStatus === "verified"
                        ? "Verified"
                        : "Verify"}
                    </>
                  )}
                </button>
              </div>

              {verificationStatus === "verified" && (
                <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-xl">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-semibold">Email verified</span>
                </div>
              )}

              {verificationStatus === "pending" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-yellow-700 bg-yellow-50 p-3 rounded-xl">
                    <XCircle className="w-5 h-5" />
                    <span className="text-sm font-semibold">
                      Email not verified
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={verificationCode}
                      onChange={(e) => {
                        // Only allow numbers, max 6 digits
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setVerificationCode(value);
                      }}
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500 text-center text-xl font-bold tracking-widest"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyCode}
                      disabled={verifying || verificationCode.length !== 6}
                      className="px-4 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {verifying ? "Verifying..." : "Verify"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-green-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {t("save", language)}
              </>
            )}
          </button>

          {saved && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center">
              <p className="text-green-800 font-semibold">
                Profile saved successfully!
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
