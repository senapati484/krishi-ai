"use client";

import { useState } from "react";
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useStore } from "@/store/useStore";
import { t } from "@/lib/i18n";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { language, login } = useStore();
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        // Use login function to save both user and token, including emailVerified
        login(data.user, data.token);
        router.push("/");
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const labels = {
    hi: {
      title: "लॉग इन करें",
      email: "ईमेल",
      password: "पासवर्ड",
      login: "लॉग इन",
      noAccount: "खाता नहीं है?",
      register: "रजिस्टर करें",
      forgotPassword: "पासवर्ड भूल गए?",
    },
    bn: {
      title: "লগইন করুন",
      email: "ইমেইল",
      password: "পাসওয়ার্ড",
      login: "লগইন",
      noAccount: "অ্যাকাউন্ট নেই?",
      register: "নিবন্ধন করুন",
      forgotPassword: "পাসওয়ার্ড ভুলে গেছেন?",
    },
    en: {
      title: "Login",
      email: "Email",
      password: "Password",
      login: "Login",
      noAccount: "Don't have an account?",
      register: "Register",
      forgotPassword: "Forgot password?",
    },
  };

  const t_labels = labels[language];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-md mx-auto px-4 py-8">
        <Link
          href="/"
          className="text-green-700 font-semibold flex items-center gap-2 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          {t("back", language)}
        </Link>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            {t_labels.title}
          </h1>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t_labels.email}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t_labels.password}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  className="w-full pl-10 pr-12 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-green-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Loading...
                </>
              ) : (
                t_labels.login
              )}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-gray-600">
              {t_labels.noAccount}{" "}
              <Link href="/register" className="text-green-700 font-semibold">
                {t_labels.register}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

