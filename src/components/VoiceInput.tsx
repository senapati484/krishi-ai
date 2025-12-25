"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Send } from "lucide-react";

interface VoiceInputProps {
  onTranscript: (transcript: string) => void;
  language: "hi" | "bn" | "en";
}

export default function VoiceInput({
  onTranscript,
  language,
}: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if browser supports Web Speech API
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang =
        language === "hi" ? "hi-IN" : language === "bn" ? "bn-IN" : "en-IN";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript + interimTranscript);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "no-speech") {
          setIsRecording(false);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, [language]);

  const startRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        setTranscript("");
      } catch (error) {
        console.error("Error starting recognition:", error);
      }
    } else {
      // Fallback: Use text input if speech recognition not available
      const text = prompt(
        "Speech recognition not available. Please type your query:"
      );
      if (text) {
        setTranscript(text);
      }
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSubmit = () => {
    if (transcript.trim()) {
      onTranscript(transcript.trim());
      setTranscript("");
    }
  };

  const labels = {
    hi: {
      speak: "बोलें",
      stop: "रोकें",
      send: "भेजें",
      placeholder: "या यहाँ टाइप करें...",
    },
    bn: {
      speak: "বলুন",
      stop: "থামুন",
      send: "পাঠান",
      placeholder: "অথবা এখানে টাইপ করুন...",
    },
    en: {
      speak: "Speak",
      stop: "Stop",
      send: "Send",
      placeholder: "Or type here...",
    },
  };

  const t = labels[language];

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`
            flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-semibold text-lg transition-all
            ${
              isRecording
                ? "bg-red-600 text-white hover:bg-red-700 animate-pulse"
                : "bg-green-600 text-white hover:bg-green-700"
            }
          `}
        >
          {isRecording ? (
            <Square className="w-6 h-6" />
          ) : (
            <Mic className="w-6 h-6" />
          )}
          {isRecording ? t.stop : t.speak}
        </button>
      </div>

      {transcript && (
        <div className="space-y-2">
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder={t.placeholder}
            className="w-full p-4 border-2 border-gray-300 rounded-xl resize-none focus:outline-none focus:border-green-500 min-h-[100px]"
          />
          <button
            onClick={handleSubmit}
            className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-green-700 transition-colors"
          >
            <Send className="w-5 h-5" />
            {t.send}
          </button>
        </div>
      )}
    </div>
  );
}
