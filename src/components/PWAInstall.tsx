'use client';

import { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { t } from '@/lib/i18n';

export default function PWAInstall() {
  const { language } = useStore();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    
    setDeferredPrompt(null);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-xl shadow-2xl p-4 max-w-sm w-[90%] border-2 border-green-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 mb-1">Install Krishi AI</h3>
          <p className="text-sm text-gray-600">
            Install this app on your device for quick access
          </p>
        </div>
        <button
          onClick={() => setShowPrompt(false)}
          className="p-1 hover:bg-gray-100 rounded-full"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>
      <button
        onClick={handleInstall}
        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
      >
        <Download className="w-5 h-5" />
        Install Now
      </button>
    </div>
  );
}

