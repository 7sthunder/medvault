"use client";

import { useEffect, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  Pill,
  Clock,
  Calendar,
  CheckCircle2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { api } from "@/lib/trpc";
import { useAnimationTheme } from "@/components/theme/DynamicBackground";
import { cn } from "@/lib/utils";

export interface VoiceAssistantDrawerProps {
  open: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
}

interface SpeechRecognitionResultItem {
  transcript: string;
}

interface SpeechRecognitionResultList {
  [index: number]: {
    [index: number]: SpeechRecognitionResultItem;
  };
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface ISpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

export function VoiceAssistantDrawer({ open, onClose }: VoiceAssistantDrawerProps) {
  const { language } = useI18n();
  const { theme } = useAnimationTheme();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechMuted, setSpeechMuted] = useState(false);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "intro",
      sender: "assistant",
      text:
        language === "ta"
          ? "வணக்கம்! நான் உங்கள் மெட்வால்ட் குரல் உதவியாளர். 'அடுத்த மருந்து எப்போது?', 'என்ன மருந்துகள்?', அல்லது 'மருந்தை எடுத்தேன்' என்று கேளுங்கள்."
          : language === "hi"
            ? "नमस्ते! मैं आपका मेडवॉल्ट वॉयस असिस्टेंट हूँ। 'अगली खुराक कब है?', 'मेरी दवाइयाँ', या 'दवा ले ली' पूछें।"
            : "Hello! I am your MedVault Voice Assistant. Ask 'When is my next dose?', 'What are my medicines?', or 'Mark dose as taken'.",
      timestamp: "Just now",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  // Queries for live patient data with test safety
  const utils = api.useUtils?.() as ReturnType<typeof api.useUtils> | undefined;
  const dashboardQuery = api.dashboard?.get?.useQuery ? api.dashboard.get.useQuery() : { data: undefined };
  const dashboardData = dashboardQuery?.data;
  const appointmentsQuery = api.appointments?.list?.useQuery ? api.appointments.list.useQuery({ includePast: false }) : { data: undefined };
  const appointments = appointmentsQuery?.data;

  const takeMutation = api.dose?.take?.useMutation
    ? api.dose.take.useMutation({
        onSuccess: (updated) => {
          toast.success(`${updated.medication.name} logged as taken!`);
          void utils?.dashboard?.get?.invalidate();
          void utils?.dose?.today?.invalidate();
        },
      })
    : { mutateAsync: async () => {}, mutate: () => {}, isPending: false };

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSpeaking, isListening]);

  // Voice synthesis speaker
  const speakText = (text: string) => {
    if (speechMuted || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === "ta" ? "ta-IN" : language === "hi" ? "hi-IN" : "en-US";
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      // Try selecting a matching voice
      const voices = window.speechSynthesis.getVoices();
      const matchingVoice = voices.find((v) => v.lang.startsWith(utterance.lang));
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
    }
  };

  // Process user intent & generate response
  const processQuery = async (query: string) => {
    const q = query.toLowerCase().trim();
    if (!q) return;

    // Add user message
    const userMsg: Message = {
      id: Math.random().toString(),
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");

    let reply = "";

    // 1. Next Dose Queries
    if (
      q.includes("next dose") ||
      q.includes("next medicine") ||
      q.includes("when is my dose") ||
      q.includes("அடுத்த மருந்து") ||
      q.includes("अगली खुराक")
    ) {
      if (dashboardData?.nextDose) {
        const d = dashboardData.nextDose;
        const timeStr = new Date(d.scheduledFor).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        if (language === "ta") {
          reply = `உங்கள் அடுத்த மருந்து ${d.medication.name} (${d.medication.dosageAmount} ${d.medication.dosageUnit}) நேரம் ${timeStr} மணிக்கு திட்டமிடப்பட்டுள்ளது.`;
        } else if (language === "hi") {
          reply = `आपकी अगली खुराक ${d.medication.name} (${d.medication.dosageAmount} ${d.medication.dosageUnit}) समय ${timeStr} पर निर्धारित है।`;
        } else {
          reply = `Your next dose is ${d.medication.name} (${d.medication.dosageAmount} ${d.medication.dosageUnit}) scheduled for ${timeStr}.`;
        }
      } else {
        reply =
          language === "ta"
            ? "இன்றைய அனைத்து மருந்துகளும் முடிக்கப்பட்டுள்ளன! வரவிருக்கும் அளவுகள் எதுவும் இல்லை."
            : language === "hi"
              ? "आज की सभी खुराकें पूरी हो चुकी हैं! कोई खुराक बाकी नहीं है।"
              : "You are all caught up! There are no remaining scheduled doses for today.";
      }
    }
    // 2. Active Medications Queries
    else if (
      q.includes("my medicines") ||
      q.includes("what medicines") ||
      q.includes("prescriptions") ||
      q.includes("என்ன மருந்துகள்") ||
      q.includes("मेरी दवाइयाँ")
    ) {
      if (dashboardData?.medications && dashboardData.medications.length > 0) {
        const medNames = dashboardData.medications.map((m) => `${m.name} ${m.dosageAmount}${m.dosageUnit}`).join(", ");
        if (language === "ta") {
          reply = `உங்களிடம் ${dashboardData.medications.length} மருந்துகள் உள்ளன: ${medNames}.`;
        } else if (language === "hi") {
          reply = `आपकी सक्रिय दवाइयाँ हैं: ${medNames}।`;
        } else {
          reply = `You have ${dashboardData.medications.length} active prescriptions: ${medNames}.`;
        }
      } else {
        reply =
          language === "ta"
            ? "தற்போது உங்களிடம் மருந்துகள் எதுவும் பதிவு செய்யப்படவில்லை."
            : language === "hi"
              ? "वर्तमान में कोई दवा दर्ज नहीं है।"
              : "You do not have any registered medications right now.";
      }
    }
    // 3. Mark Dose as Taken
    else if (
      q.includes("take dose") ||
      q.includes("took my medicine") ||
      q.includes("mark taken") ||
      q.includes("take metformin") ||
      q.includes("மருந்தை எடுத்தேன்") ||
      q.includes("दवा ले ली")
    ) {
      if (dashboardData?.nextDose) {
        const targetDose = dashboardData.nextDose;
        await takeMutation.mutateAsync({ doseId: targetDose.id });
        if (language === "ta") {
          reply = `${targetDose.medication.name} வெற்றிகரமாக எடுக்கப்பட்டது என பதிவு செய்யப்பட்டது! தொடர் ஆரோக்கிய வாழ்த்துகள்.`;
        } else if (language === "hi") {
          reply = `${targetDose.medication.name} सफलतापूर्वक ली गई दर्ज कर दी गई है! बहुत बढ़िया।`;
        } else {
          reply = `Great job! I have recorded your ${targetDose.medication.name} dose as taken.`;
        }
      } else {
        reply =
          language === "ta"
            ? "எடுக்க வேண்டிய நிலுவையில் உள்ள மருந்துகள் எதுவும் தற்போது இல்லை."
            : language === "hi"
              ? "इस समय लेने के लिए कोई लंबित खुराक नहीं है।"
              : "There are no pending doses to mark as taken right now.";
      }
    }
    // 4. Doctor Appointments
    else if (
      q.includes("appointment") ||
      q.includes("doctor") ||
      q.includes("clinic") ||
      q.includes("மருத்துவ சந்திப்பு") ||
      q.includes("डॉक्टर") ||
      q.includes("अपॉइंटमेंट")
    ) {
      if (appointments && appointments.length > 0) {
        const nextAppt = appointments[0]!;
        const apptDate = new Date(nextAppt.appointmentDate).toLocaleDateString([], {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        if (language === "ta") {
          reply = `உங்களுக்கு ${nextAppt.doctorName} (${nextAppt.specialty || "General"}) மருத்துவ சந்திப்பு ${apptDate} அன்று ${nextAppt.clinicName || "Clinic"} இடத்தில் திட்டமிடப்பட்டுள்ளது.`;
        } else if (language === "hi") {
          reply = `आपका अगला परामर्श डॉ. ${nextAppt.doctorName} (${nextAppt.specialty || "General"}) के साथ ${apptDate} को है।`;
        } else {
          reply = `Your next appointment is with Dr. ${nextAppt.doctorName} (${nextAppt.specialty || "General"}) on ${apptDate} at ${nextAppt.clinicName || "Clinic"}.`;
        }
      } else {
        reply =
          language === "ta"
            ? "வரவிருக்கும் மருத்துவ சந்திப்புகள் எதுவும் திட்டமிடப்படவில்லை."
            : language === "hi"
              ? "कोई आगामी डॉक्टर अपॉइंटमेंट निर्धारित नहीं है।"
              : "You have no upcoming doctor appointments scheduled.";
      }
    }
    // 5. Adherence / Streak
    else if (
      q.includes("adherence") ||
      q.includes("streak") ||
      q.includes("score") ||
      q.includes("விகிதம்") ||
      q.includes("अनुपालन")
    ) {
      const adh = dashboardData?.stats.adherenceToday ?? 100;
      const streak = dashboardData?.stats.currentStreak ?? 0;
      if (language === "ta") {
        reply = `இன்றைய உங்கள் உட்கொள்ளல் விகிதம் ${adh}%. உங்கள் தொடர் நாட்கள் ${streak} நாட்கள் ஆகும்.`;
      } else if (language === "hi") {
        reply = `आज का आपका अनुपालन ${adh}% है, और स्ट्रीक ${streak} दिनों की है।`;
      } else {
        reply = `Your adherence score today is ${adh}%, and your current streak is ${streak} days. Keep it up!`;
      }
    }
    // 6. Fallback Guidance
    else {
      if (language === "ta") {
        reply = "நான் உங்களுக்கு மருந்துகள், அடுத்த டோஸ், அல்லது மருத்துவ சந்திப்புகளை கண்டறிய உதவ முடியும். 'அடுத்த மருந்து என்ன?' என்று கேட்டுப் பாருங்கள்.";
      } else if (language === "hi") {
        reply = "मैं आपकी दवाइयों, अगली खुराक और डॉक्टर अपॉइंटमेंट में मदद कर सकता हूँ। 'मेरी अगली खुराक कब है?' पूछकर देखें।";
      } else {
        reply = "I can help check your medication schedule, report your next dose, or log taken medicines. Try asking 'When is my next dose?' or 'What are my medicines?'.";
      }
    }

    const assistantMsg: Message = {
      id: Math.random().toString(),
      sender: "assistant",
      text: reply,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, assistantMsg]);
    speakText(reply);
  };

  // Toggle Speech Recognition
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: new () => ISpeechRecognition; webkitSpeechRecognition?: new () => ISpeechRecognition })
        .SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: new () => ISpeechRecognition; webkitSpeechRecognition?: new () => ISpeechRecognition })
        .webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser. You can type commands below.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === "ta" ? "ta-IN" : language === "hi" ? "hi-IN" : "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (transcript) {
          processQuery(transcript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
      toast.error("Microphone access could not be initialized.");
    }
  };

  if (!open) return null;

  const themeBorder =
    theme === "batman"
      ? "border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.25)]"
      : theme === "spidergwen"
        ? "border-pink-500/30 shadow-[0_0_40px_rgba(244,114,182,0.25)]"
        : theme === "plain"
          ? "border-slate-300 dark:border-slate-700 shadow-2xl"
          : "border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.25)]";

  const themeAccentBg =
    theme === "batman"
      ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/30"
      : theme === "spidergwen"
        ? "bg-pink-500/15 text-pink-400 border-pink-500/30"
        : theme === "plain"
          ? "bg-slate-200/80 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700"
          : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-assistant-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className={cn(
          "relative flex flex-col w-full max-w-lg h-[85vh] sm:h-[600px] rounded-t-3xl sm:rounded-3xl bg-slate-950/95 text-slate-100 backdrop-blur-2xl border",
          themeBorder,
          "overflow-hidden transition-all duration-300",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-10 items-center justify-center rounded-2xl border shrink-0 transition-transform",
                themeAccentBg,
                isListening && "scale-110 animate-pulse",
              )}
            >
              <Mic className="size-5" />
            </div>
            <div>
              <h2 id="voice-assistant-title" className="font-heading text-base font-bold text-white flex items-center gap-2">
                MedVault Voice Assistant
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-primary/20 text-primary-300 border border-primary/30">
                  <Sparkles className="size-2.5" />
                  Live AI
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {isListening ? "Listening... Speak your query" : isSpeaking ? "Speaking response..." : "Ask me anything about your care"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (isSpeaking) {
                  window.speechSynthesis?.cancel();
                  setIsSpeaking(false);
                }
                setSpeechMuted(!speechMuted);
              }}
              title={speechMuted ? "Unmute voice audio" : "Mute voice audio"}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              {speechMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            </button>
            <button
              type="button"
              onClick={() => {
                if (recognitionRef.current) recognitionRef.current.stop();
                if (typeof window !== "undefined") window.speechSynthesis?.cancel();
                onClose();
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Animated Waveform Visualization when Listening or Speaking */}
        {(isListening || isSpeaking) && (
          <div className="flex items-center justify-center gap-1.5 py-3 bg-white/5 border-b border-white/10">
            <span className="w-1 bg-cyan-400 rounded-full animate-bounce [animation-delay:0ms] h-4" />
            <span className="w-1 bg-teal-400 rounded-full animate-bounce [animation-delay:150ms] h-8" />
            <span className="w-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:300ms] h-6" />
            <span className="w-1 bg-cyan-400 rounded-full animate-bounce [animation-delay:450ms] h-10" />
            <span className="w-1 bg-pink-400 rounded-full animate-bounce [animation-delay:200ms] h-5" />
            <span className="w-1 bg-teal-400 rounded-full animate-bounce [animation-delay:350ms] h-7" />
            <span className="w-1 bg-cyan-400 rounded-full animate-bounce [animation-delay:100ms] h-3" />
            <span className="text-xs font-semibold text-slate-300 ml-2">
              {isListening ? "Listening..." : "Speaking..."}
            </span>
          </div>
        )}

        {/* Chat Stream Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex flex-col max-w-[85%] rounded-2xl p-3.5 text-sm transition-all",
                m.sender === "user"
                  ? "ml-auto bg-primary/25 border border-primary/30 text-white rounded-br-xs"
                  : "mr-auto bg-white/10 border border-white/10 text-slate-200 rounded-bl-xs",
              )}
            >
              <div className="flex items-center justify-between gap-4 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {m.sender === "user" ? "You" : "MedVault Assistant"}
                </span>
                <span className="text-[10px] text-slate-400">{m.timestamp}</span>
              </div>
              <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto border-t border-white/10 bg-white/5 scrollbar-none">
          {[
            { label: "Next Dose", icon: Clock, query: "When is my next dose?" },
            { label: "My Medicines", icon: Pill, query: "What are my medicines?" },
            { label: "Take Dose", icon: CheckCircle2, query: "Mark dose as taken" },
            { label: "Appointments", icon: Calendar, query: "Do I have any doctor appointments?" },
          ].map((chip) => {
            const Icon = chip.icon;
            return (
              <button
                key={chip.label}
                type="button"
                onClick={() => processQuery(chip.query)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 transition-all shrink-0 hover:scale-[1.03]"
              >
                <Icon className="size-3 text-cyan-400" />
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mic & Input Controls */}
        <div className="p-4 border-t border-white/10 bg-slate-950/80 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={toggleListening}
            className={cn(
              "relative flex size-11 items-center justify-center rounded-2xl border transition-all shrink-0 shadow-lg",
              isListening
                ? "bg-rose-500 text-white border-rose-400 animate-pulse scale-105"
                : cn(themeAccentBg, "hover:scale-105"),
            )}
            title={isListening ? "Stop listening" : "Start speaking"}
          >
            {isListening ? <MicOff className="size-5" /> : <Mic className="size-5" />}
          </button>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (inputText.trim()) processQuery(inputText);
            }}
            className="flex-1 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask anything or click mic to speak..."
              className="w-full bg-white/10 border border-white/15 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!inputText.trim()}
              className="rounded-xl size-10 p-0 shrink-0"
            >
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
