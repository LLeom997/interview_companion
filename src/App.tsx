import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Settings, Briefcase, User, FileText, BrainCircuit, RefreshCw, Activity, Loader2, Edit2, Play, Building2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

import { useAudioRecorder } from './hooks/useAudioRecorder';
import { askReasoningModelStream, askDeepDiveModelStream, transcribeAudio, CopilotContext, CopilotResponse, DEFAULT_WHIRLPOOL_DOCUMENT, ExtraInfoDoc } from './services/openRouterService';
import { blobToAudioBuffer, audioBufferToWav } from './utils/audioConverter';
import { MarkdownViewer } from './components/MarkdownViewer';

interface Metrics {
  transcriptionLatency: number;
  transcriptionWords: number;
  transcriptionWps: number;
  reasoningLatency: number;
  reasoningWords: number;
  reasoningWps: number;
  totalLatency: number;
  isReasoningComplete: boolean;
}

export default function App() {
  const [context, setContext] = useState<CopilotContext>(() => {
    const saved = localStorage.getItem('interview_copilot_context');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.whirlpoolDocument) {
          parsed.whirlpoolDocument = DEFAULT_WHIRLPOOL_DOCUMENT;
        }
        // Migrate extraInfo from string to array of documents if needed
        if (typeof parsed.extraInfo === 'string') {
          const oldText = parsed.extraInfo.trim();
          parsed.extraInfo = oldText ? [
            {
              id: 'default-legacy',
              header: 'Legacy Extra Information',
              information: oldText
            }
          ] : [];
        }
        return parsed;
      } catch (e) {
        console.error("Failed to parse saved context, using defaults", e);
      }
    }
    return {
      resume: '',
      companyInfo: '',
      jobDescription: '',
      targetRole: '',
      extraInfo: [],
      whirlpoolDocument: DEFAULT_WHIRLPOOL_DOCUMENT
    };
  });

  useEffect(() => {
    localStorage.setItem('interview_copilot_context', JSON.stringify(context));
  }, [context]);

  const [activeGroundingTab, setActiveGroundingTab] = useState<'persona' | 'company' | 'whirlpool' | 'extra'>('persona');
  const [activeExtraDocId, setActiveExtraDocId] = useState<string | null>(null);

  useEffect(() => {
    if (Array.isArray(context.extraInfo) && context.extraInfo.length > 0) {
      if (!activeExtraDocId || !context.extraInfo.some(d => d.id === activeExtraDocId)) {
        setActiveExtraDocId(context.extraInfo[0].id);
      }
    } else {
      setActiveExtraDocId(null);
    }
  }, [context.extraInfo, activeExtraDocId]);

  const handleAddExtraInfoDoc = () => {
    const newId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    setContext(prev => {
      const currentDocs = Array.isArray(prev.extraInfo) ? prev.extraInfo : [];
      return {
        ...prev,
        extraInfo: [
          ...currentDocs,
          {
            id: newId,
            header: '',
            information: ''
          }
        ]
      };
    });
    setActiveExtraDocId(newId);
    setActiveGroundingTab('extra');
  };

  const handleUpdateExtraInfoDoc = (id: string, field: 'header' | 'information', value: string) => {
    setContext(prev => {
      const currentDocs = Array.isArray(prev.extraInfo) ? prev.extraInfo : [];
      return {
        ...prev,
        extraInfo: currentDocs.map(doc => doc.id === id ? { ...doc, [field]: value } : doc)
      };
    });
  };

  const handleDeleteExtraInfoDoc = (id: string) => {
    setContext(prev => {
      const currentDocs = Array.isArray(prev.extraInfo) ? prev.extraInfo : [];
      return {
        ...prev,
        extraInfo: currentDocs.filter(doc => doc.id !== id)
      };
    });
  };

  const handleRestoreDefaultDocument = () => {
    if (window.confirm("Are you sure you want to restore the Whirlpool document to its original defaults? Any custom edits will be overwritten.")) {
      setContext(prev => ({
        ...prev,
        whirlpoolDocument: DEFAULT_WHIRLPOOL_DOCUMENT
      }));
    }
  };

  const [transcript, setTranscript] = useState<Array<{ id: string; text: string; role: 'interviewer' | 'candidate'; timestamp: number }>>([]);
  const [editableTranscriptId, setEditableTranscriptId] = useState<string | null>(null);
  const [copilotResponse, setCopilotResponse] = useState<CopilotResponse | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const [activeMode, setActiveMode] = useState<'default' | 'deep-dive'>('default');
  const [deepDiveResponse, setDeepDiveResponse] = useState<string | null>(null);
  const [isDeepDiveAnalyzing, setIsDeepDiveAnalyzing] = useState(false);
  const deepDiveAbortRef = useRef<AbortController | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto scroll transcript to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  const handleRecordingComplete = useCallback(async (audioBlob: Blob) => {
    try {
      setIsTranscribing(true);

      const audioBuffer = await blobToAudioBuffer(audioBlob);
      const wavArrayBuffer = audioBufferToWav(audioBuffer);

      let binary = '';
      const bytes = new Uint8Array(wavArrayBuffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Audio = window.btoa(binary);

      const format = 'wav';

      const t0 = performance.now();
      const transcribedText = await transcribeAudio(base64Audio, format);
      const t1 = performance.now();

      const tLatency = (t1 - t0) / 1000;
      const tWords = transcribedText ? transcribedText.split(/\s+/).length : 0;
      const tWps = tWords / Math.max(tLatency, 0.01);

      setIsTranscribing(false);

      if (transcribedText && !transcribedText.startsWith("ERROR")) {
        setTranscript(prev => [
          ...prev,
          { id: Date.now().toString(), text: transcribedText, role: 'interviewer', timestamp: Date.now() }
        ]);

        const currentMetrics = {
          transcriptionLatency: tLatency,
          transcriptionWords: tWords,
          transcriptionWps: tWps,
          reasoningLatency: 0,
          reasoningWords: 0,
          reasoningWps: 0,
          totalLatency: 0,
          isReasoningComplete: false
        };
        setMetrics(currentMetrics);

        setIsAnalyzing(true);
        setCopilotResponse(null);
        setDeepDiveResponse(null);

        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        const r0 = performance.now();
        let finalAdvice = "";

        try {
          await askReasoningModelStream(transcribedText, context, (currentText) => {
            finalAdvice = currentText;
            setCopilotResponse({ answer: currentText });
          }, abortControllerRef.current.signal);
        } finally {
          abortControllerRef.current = null;
        }

        const r1 = performance.now();

        const rLatency = (r1 - r0) / 1000;
        const rWords = finalAdvice ? finalAdvice.split(/\s+/).length : 0;
        const rWps = rWords / Math.max(rLatency, 0.01);

        setMetrics({
          ...currentMetrics,
          reasoningLatency: rLatency,
          reasoningWords: rWords,
          reasoningWps: rWps,
          totalLatency: tLatency + rLatency,
          isReasoningComplete: true
        });

      } else {
        console.error("Failed to transcribe:", transcribedText);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTranscribing(false);
      setIsAnalyzing(false);
    }
  }, [context]);

  const handleRetry = useCallback(async () => {
    if (transcript.length === 0) return;
    const lastMsg = transcript[transcript.length - 1];

    setIsAnalyzing(true);
    setCopilotResponse(null);
    setDeepDiveResponse(null);
    setEditableTranscriptId(null);

    if (metrics) {
      setMetrics({
        ...metrics,
        reasoningLatency: 0,
        reasoningWords: 0,
        reasoningWps: 0,
        totalLatency: 0,
        isReasoningComplete: false
      });
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const r0 = performance.now();
    let finalAdvice = "";

    try {
      await askReasoningModelStream(lastMsg.text, context, (currentText) => {
        finalAdvice = currentText;
        setCopilotResponse({ answer: currentText });
      }, abortControllerRef.current.signal);
    } finally {
      abortControllerRef.current = null;
    }

    const r1 = performance.now();
    const rLatency = (r1 - r0) / 1000;
    const rWords = finalAdvice ? finalAdvice.split(/\s+/).length : 0;
    const rWps = rWords / Math.max(rLatency, 0.01);

    setMetrics(prev => prev ? {
      ...prev,
      reasoningLatency: rLatency,
      reasoningWords: rWords,
      reasoningWps: rWps,
      totalLatency: prev.transcriptionLatency + rLatency,
      isReasoningComplete: true
    } : null);

    setIsAnalyzing(false);
  }, [transcript, context, metrics]);

  const handleDeepDive = useCallback(async () => {
    if (transcript.length === 0) return;
    const lastMsg = transcript.filter(t => t.role === 'interviewer').slice(-1)[0] || transcript[transcript.length - 1];
    const prevAnswer = copilotResponse?.answer || '';

    setIsDeepDiveAnalyzing(true);
    setDeepDiveResponse("");

    if (deepDiveAbortRef.current) {
      deepDiveAbortRef.current.abort();
    }
    deepDiveAbortRef.current = new AbortController();

    try {
      await askDeepDiveModelStream(
        lastMsg.text,
        prevAnswer,
        context.jobDescription,
        (currentText) => {
          setDeepDiveResponse(currentText);
        },
        deepDiveAbortRef.current.signal
      );
    } catch (err) {
      console.error("Deep Dive Error:", err);
    } finally {
      deepDiveAbortRef.current = null;
      setIsDeepDiveAnalyzing(false);
    }
  }, [transcript, copilotResponse, context.jobDescription]);

  useEffect(() => {
    if (activeMode === 'deep-dive' && transcript.length > 0 && copilotResponse && !deepDiveResponse && !isDeepDiveAnalyzing) {
      handleDeepDive();
    }
  }, [activeMode, transcript, copilotResponse, deepDiveResponse, isDeepDiveAnalyzing, handleDeepDive]);

  const { isRecording, startRecording, stopRecording, toggleRecording, isSupported } = useAudioRecorder(handleRecordingComplete);

  const handleCancelAndReset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (deepDiveAbortRef.current) {
      deepDiveAbortRef.current.abort();
      deepDiveAbortRef.current = null;
    }
    if (isRecording) {
      stopRecording();
    }
    setIsAnalyzing(false);
    setIsTranscribing(false);
    setIsDeepDiveAnalyzing(false);
    setCopilotResponse(null);
    setDeepDiveResponse(null);
    setMetrics(null);
    setEditableTranscriptId(null);
    console.log("Reasoning ongoing canceled and session reset.");
  }, [isRecording, stopRecording]);

  // Keyboard shortcuts for recording
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === 'a' && !isRecording && isSupported && !isTranscribing && !isAnalyzing) {
        event.preventDefault();
        startRecording();
      } else if (key === 's' && isRecording) {
        event.preventDefault();
        stopRecording();
      } else if (key === 'd') {
        event.preventDefault();
        handleCancelAndReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording, startRecording, stopRecording, isSupported, isTranscribing, isAnalyzing, handleCancelAndReset]);

  const clearTranscript = () => {
    setTranscript([]);
    setCopilotResponse(null);
    setMetrics(null);
  };

  const handleContextChange = (field: keyof CopilotContext, value: string) => {
    setContext(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex flex-col h-screen bg-[#09090b] text-zinc-100 font-sans overflow-hidden select-none">
      {/* Top Navigation / Status Bar with Glowing Borders */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-zinc-800/80 bg-[#0c0c0e]/90 backdrop-blur-md shrink-0 shadow-[0_4px_30px_rgba(0,0,0,0.4)] relative z-25">
        <div className="flex items-center gap-4">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping opacity-75"></div>
            <div className="relative w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xs font-black tracking-widest uppercase text-emerald-400 font-heading">
              INTERVIEW COMPANION
            </h1>
            <span className="text-[9px] text-zinc-500 font-mono tracking-tighter uppercase">Grounding Response Engine • v2.6</span>
          </div>
        </div>

        {/* Dynamic Equalizer Visualizer & Hotkeys Guide */}
        <div className="hidden lg:flex items-center gap-6">
          
          {/* Active Soundwave equalizing bars */}
          {isRecording ? (
            <div className="flex gap-0.5 items-center justify-center px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-lg h-7">
              <span className="text-[9px] font-mono font-bold text-red-400 tracking-widest uppercase flex items-center gap-1.5 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                LISTENING
              </span>
              <div className="flex gap-0.5 items-end h-3 ml-2 pr-0.5">
                <span className="w-[1.5px] bg-red-400 rounded-full animate-wave-short" style={{ animationDelay: '0.1s' }}></span>
                <span className="w-[1.5px] bg-red-400 rounded-full animate-wave-medium" style={{ animationDelay: '0.4s' }}></span>
                <span className="w-[1.5px] bg-red-400 rounded-full animate-wave-tall" style={{ animationDelay: '0s' }}></span>
                <span className="w-[1.5px] bg-red-400 rounded-full animate-wave-medium" style={{ animationDelay: '0.6s' }}></span>
                <span className="w-[1.5px] bg-red-400 rounded-full animate-wave-short" style={{ animationDelay: '0.2s' }}></span>
              </div>
            </div>
          ) : (
            <div className="flex gap-1.5 items-center justify-center px-2.5 py-1 bg-zinc-950/40 border border-zinc-850 rounded-lg h-7">
              <span className="w-1 h-1 rounded-full bg-zinc-650"></span>
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Awaiting Audio Input</span>
            </div>
          )}

          {/* Premium Hotkeys bar */}
          <div className="flex items-center gap-3 bg-zinc-950/60 px-3 py-1 rounded-lg border border-zinc-850 text-[9px] font-mono text-zinc-500">
            <span className="text-zinc-600 uppercase font-black tracking-wider text-[8px] mr-1">HOTKEYS:</span>
            <span className="flex items-center gap-1"><kbd className="bg-zinc-900 border border-zinc-800 px-1 py-0.25 rounded text-zinc-300 font-bold">[A]</kbd> Record</span>
            <span className="flex items-center gap-1"><kbd className="bg-zinc-900 border border-zinc-800 px-1 py-0.25 rounded text-zinc-300 font-bold">[S]</kbd> Stop</span>
            <span className="flex items-center gap-1"><kbd className="bg-zinc-900 border border-zinc-800 px-1 py-0.25 rounded text-zinc-300 font-bold">[D]</kbd> Reset</span>
          </div>
        </div>

        <div className="flex gap-4 sm:gap-6 items-center">
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-[8px] uppercase text-zinc-550 font-black tracking-widest">Active Persona</span>
            <span className="text-xs font-bold text-zinc-300 truncate max-w-[120px] md:max-w-[160px]">{context.targetRole || 'General Engineer'}</span>
          </div>

          <div className="flex items-center gap-2.5">
            {!isSupported && (
              <Badge variant="destructive" className="hidden sm:inline-flex text-[9px] uppercase tracking-wider font-bold">Mic Offline</Badge>
            )}

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 h-8 bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer text-xs font-semibold">
                  <Settings className="w-3.5 h-3.5 text-zinc-400" /> Grounding Panel
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[1100px] w-[95vw] h-[85vh] flex flex-col bg-[#0c0c0e] border-zinc-800 text-zinc-100 shadow-[0_0_80px_-20px_rgba(16,185,129,0.1)] overflow-hidden">
                <DialogHeader className="border-b border-zinc-800 pb-3 shrink-0">
                  <DialogTitle className="text-zinc-100 font-extrabold text-lg flex items-center gap-2">
                    <Settings className="w-5 h-5 text-emerald-500" /> Grounding Context Control Center
                  </DialogTitle>
                </DialogHeader>
                
                <div className="flex flex-1 min-h-0 mt-4 gap-6 overflow-hidden">
                  {/* Left Tab Sidebar */}
                  <div className="w-[230px] shrink-0 flex flex-col gap-2 border-r border-zinc-800/80 pr-4 overflow-y-auto custom-scrollbar">
                    <button
                      type="button"
                      onClick={() => setActiveGroundingTab('persona')}
                      className={`flex items-start gap-3 w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                        activeGroundingTab === 'persona'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-white shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                          : 'bg-transparent border-transparent hover:border-zinc-800/80 hover:bg-zinc-900/40 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <User className={`w-4 h-4 mt-0.5 shrink-0 ${activeGroundingTab === 'persona' ? 'text-emerald-500' : 'text-zinc-500'}`} />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Candidate Profile</span>
                        <span className="text-[9px] text-zinc-500 font-normal mt-0.5 leading-snug">Target role & resume</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveGroundingTab('company')}
                      className={`flex items-start gap-3 w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                        activeGroundingTab === 'company'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-white shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                          : 'bg-transparent border-transparent hover:border-zinc-800/80 hover:bg-zinc-900/40 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <Briefcase className={`w-4 h-4 mt-0.5 shrink-0 ${activeGroundingTab === 'company' ? 'text-emerald-500' : 'text-zinc-500'}`} />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Job & Company</span>
                        <span className="text-[9px] text-zinc-500 font-normal mt-0.5 leading-snug">JD and company values</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveGroundingTab('whirlpool')}
                      className={`flex items-start gap-3 w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                        activeGroundingTab === 'whirlpool'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-white shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                          : 'bg-transparent border-transparent hover:border-zinc-800/80 hover:bg-zinc-900/40 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <Building2 className={`w-4 h-4 mt-0.5 shrink-0 ${activeGroundingTab === 'whirlpool' ? 'text-emerald-500' : 'text-zinc-500'}`} />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Whirlpool Context</span>
                        <span className="text-[9px] text-zinc-500 font-normal mt-0.5 leading-snug">Continuous projects log</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveGroundingTab('extra')}
                      className={`flex items-start gap-3 w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                        activeGroundingTab === 'extra'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-white shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                          : 'bg-transparent border-transparent hover:border-zinc-800/80 hover:bg-zinc-900/40 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <FileText className={`w-4 h-4 mt-0.5 ${activeGroundingTab === 'extra' ? 'text-emerald-500' : 'text-zinc-500'}`} />
                        {Array.isArray(context.extraInfo) && context.extraInfo.length > 0 && (
                          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-extrabold text-zinc-950 shadow-[0_0_8px_rgba(16,185,129,0.4)]">
                            {context.extraInfo.length}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Extra Documents</span>
                        <span className="text-[9px] text-zinc-500 font-normal mt-0.5 leading-snug">Supplementary sheets</span>
                      </div>
                    </button>
                  </div>
                  
                  {/* Right Tab Content Pane */}
                  <div className="flex-1 min-h-0 flex flex-col pb-2">
                    {activeGroundingTab === 'persona' && (
                      <div className="flex flex-col h-full min-h-0 space-y-4 animate-in fade-in duration-150">
                        <div className="shrink-0 pb-1 border-b border-zinc-900">
                          <h3 className="text-sm font-extrabold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                            <User className="w-4 h-4 text-emerald-500" /> Candidate Profile Grounding
                          </h3>
                          <p className="text-[11px] text-zinc-400 mt-1 font-sans leading-relaxed">
                            Define your target job title and a summary of your professional experiences. This helps the Strategic Response Engine align its tone, expertise level, and framing to match your exact level of seniority.
                          </p>
                        </div>

                        <div className="shrink-0 space-y-1.5">
                          <Label className="text-[10px] text-zinc-400 uppercase tracking-widest font-black font-mono">Target Role / Job Title</Label>
                          <Input
                            placeholder="e.g. Senior Frontend Engineer, Systems Integrator"
                            value={context.targetRole}
                            onChange={(e) => handleContextChange('targetRole', e.target.value)}
                            className="bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-emerald-500 h-10 text-xs font-semibold px-3"
                          />
                        </div>

                        <div className="flex-1 flex flex-col min-h-0 space-y-1.5">
                          <Label className="text-[10px] text-zinc-400 uppercase tracking-widest font-black font-mono">Your Resume Summary / Key Experience Highlights</Label>
                          <Textarea
                            placeholder="Paste your resume, key technical highlights, or main bullet points here..."
                            value={context.resume}
                            onChange={(e) => handleContextChange('resume', e.target.value)}
                            className="flex-1 bg-zinc-950 border-zinc-800 text-zinc-200 focus:border-emerald-500 text-xs font-mono p-3.5 resize-none leading-relaxed h-full overflow-y-auto custom-scrollbar"
                          />
                        </div>
                      </div>
                    )}

                    {activeGroundingTab === 'company' && (
                      <div className="flex flex-col h-full min-h-0 space-y-4 animate-in fade-in duration-150">
                        <div className="shrink-0 pb-1 border-b border-zinc-900">
                          <h3 className="text-sm font-extrabold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-emerald-500" /> Target Job & Company Grounding
                          </h3>
                          <p className="text-[11px] text-zinc-400 mt-1 font-sans leading-relaxed">
                            Provide the specific Job Description and Target Company values. Grounding responses in the JD allows the assistant to focus on key qualifications, highlight relevant experiences, and mirror company-specific vocabulary.
                          </p>
                        </div>

                        <div className="flex-1 grid grid-cols-2 gap-5 min-h-0">
                          <div className="flex flex-col h-full min-h-0 space-y-1.5">
                            <Label className="text-[10px] text-zinc-400 uppercase tracking-widest font-black font-mono">Job Description (JD)</Label>
                            <Textarea
                              placeholder="Paste the target job description or requirements here..."
                              value={context.jobDescription}
                              onChange={(e) => handleContextChange('jobDescription', e.target.value)}
                              className="flex-1 bg-zinc-950 border-zinc-800 text-zinc-200 focus:border-emerald-500 text-xs p-3.5 resize-none leading-relaxed h-full overflow-y-auto custom-scrollbar"
                            />
                          </div>

                          <div className="flex flex-col h-full min-h-0 space-y-1.5">
                            <Label className="text-[10px] text-zinc-400 uppercase tracking-widest font-black font-mono">Company Information & Core Values</Label>
                            <Textarea
                              placeholder="Key values, culture, target tech stack, team goals, or other insights about the company..."
                              value={context.companyInfo}
                              onChange={(e) => handleContextChange('companyInfo', e.target.value)}
                              className="flex-1 bg-zinc-950 border-zinc-800 text-zinc-200 focus:border-emerald-500 text-xs p-3.5 resize-none leading-relaxed h-full overflow-y-auto custom-scrollbar"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {activeGroundingTab === 'whirlpool' && (
                      <div className="flex flex-col h-full min-h-0 space-y-4 animate-in fade-in duration-150">
                        <div className="shrink-0 flex items-center justify-between border-b border-zinc-800 pb-2.5">
                          <div>
                            <h3 className="text-sm font-extrabold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-emerald-500" /> Whirlpool Experience Grounding
                            </h3>
                            <p className="text-[11px] text-zinc-400 mt-1 font-sans leading-relaxed">
                              Continuous work experience context for Whirlpool roles, projects, DFMEA, airflow integrations, and engineering achievements.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleRestoreDefaultDocument}
                            className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold uppercase tracking-wider border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                          >
                            Restore Defaults
                          </button>
                        </div>

                        <div className="flex-1 flex flex-col min-h-0">
                          <Textarea
                            placeholder="Paste your Whirlpool experience, projects, or achievements here..."
                            value={context.whirlpoolDocument}
                            onChange={(e) => handleContextChange('whirlpoolDocument', e.target.value)}
                            className="flex-1 bg-zinc-950 border-zinc-800 text-zinc-200 focus:border-emerald-500 text-[12px] font-mono leading-relaxed p-4 resize-none h-full overflow-y-auto custom-scrollbar"
                          />
                        </div>
                      </div>
                    )}

                    {activeGroundingTab === 'extra' && (
                      <div className="flex flex-col h-full min-h-0 space-y-4 animate-in fade-in duration-150">
                        <div className="shrink-0 pb-1 border-b border-zinc-900">
                          <h3 className="text-sm font-extrabold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-emerald-500" /> Extra Information Documents Registry
                          </h3>
                          <p className="text-[11px] text-zinc-400 mt-1 font-sans leading-relaxed">
                            Add supplementary documents like technical specifications, system log files, design requirements, and engineering spreadsheets. This injects context directly into the Strategic Response Engine.
                          </p>
                        </div>

                        <div className="flex-1 flex h-full min-h-0 gap-6 overflow-hidden">
                          {/* Left Column: Registry Sidebar */}
                          <div className="w-[250px] shrink-0 flex flex-col gap-3 h-full border-r border-zinc-800/60 pr-4 min-h-0">
                            <div className="flex items-center justify-between shrink-0">
                              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Files Registered</span>
                              <Badge variant="outline" className="text-[9px] text-emerald-400 border-emerald-500/20 bg-emerald-500/5 font-mono">
                                {context.extraInfo?.length || 0} Files
                              </Badge>
                            </div>
                            
                            {/* Scrollable list of document cards */}
                            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0 custom-scrollbar">
                              {Array.isArray(context.extraInfo) && context.extraInfo.map((doc, idx) => {
                                const isActive = doc.id === activeExtraDocId;
                                const wordCount = doc.information ? doc.information.trim().split(/\s+/).filter(Boolean).length : 0;
                                const title = doc.header.trim() || `Untitled Doc #${idx + 1}`;
                                const snippet = doc.information ? (doc.information.length > 50 ? `${doc.information.slice(0, 50)}...` : doc.information) : 'Empty document...';

                                return (
                                  <div 
                                    key={doc.id}
                                    onClick={() => setActiveExtraDocId(doc.id)}
                                    className={`group p-3 rounded-xl border text-left cursor-pointer transition-all ${
                                      isActive 
                                        ? 'bg-emerald-500/5 border-emerald-500/30 shadow-[0_4px_12px_rgba(16,185,129,0.02)]' 
                                        : 'bg-zinc-950/40 border-zinc-800/85 hover:bg-zinc-900/40 hover:border-zinc-700/60'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-2 min-w-0">
                                      <span className={`text-[11.5px] font-bold truncate flex-1 ${isActive ? 'text-emerald-400' : 'text-zinc-200'}`}>
                                        {title}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteExtraInfoDoc(doc.id);
                                        }}
                                        className="text-zinc-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0 cursor-pointer"
                                        title="Delete document"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    
                                    <p className="text-[10px] text-zinc-500 mt-1.5 line-clamp-2 leading-relaxed">
                                      {snippet}
                                    </p>
                                    
                                    <div className="flex items-center justify-between text-[8px] font-mono text-zinc-600 mt-3 pt-2 border-t border-zinc-850">
                                      <span>Doc #{idx + 1}</span>
                                      <span>{wordCount} words</span>
                                    </div>
                                  </div>
                                );
                              })}
                              
                              {(!context.extraInfo || context.extraInfo.length === 0) && (
                                <div className="text-[11px] text-zinc-500 italic text-center py-10 px-4 border border-dashed border-zinc-850 rounded-xl bg-zinc-950/10">
                                  No extra grounding documents registered.
                                </div>
                              )}
                            </div>

                            {/* Add button at the bottom of the list */}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleAddExtraInfoDoc}
                              className="w-full gap-1.5 border-dashed border-zinc-700 bg-zinc-900/20 text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-500/5 h-9.5 text-xs font-semibold shrink-0 cursor-pointer"
                            >
                              <Plus className="w-4 h-4" /> Add Document
                            </Button>
                          </div>

                          {/* Right Column: Spacious Editor */}
                          <div className="flex-1 flex flex-col h-full min-h-0 bg-[#0a0a0c] border border-zinc-800/80 rounded-2xl p-4.5">
                            {activeExtraDocId && context.extraInfo?.find(d => d.id === activeExtraDocId) ? (
                              (() => {
                                const doc = context.extraInfo.find(d => d.id === activeExtraDocId)!;
                                return (
                                  <div className="flex flex-col h-full min-h-0 space-y-4">
                                    <div className="space-y-1.5">
                                      <Label className="text-[10px] text-zinc-400 uppercase tracking-widest font-black font-mono">Document Header / Key Name</Label>
                                      <Input
                                        placeholder="e.g. Whirlpool Direct Drive Spec, System Architecture, etc."
                                        value={doc.header}
                                        onChange={(e) => handleUpdateExtraInfoDoc(doc.id, 'header', e.target.value)}
                                        className="bg-zinc-950 border-zinc-850 text-zinc-100 focus:border-emerald-500 h-10 text-xs font-semibold px-3"
                                      />
                                    </div>

                                    <div className="flex-1 flex flex-col min-h-0 space-y-1.5">
                                      <div className="flex items-center justify-between">
                                        <Label className="text-[10px] text-zinc-400 uppercase tracking-widest font-black font-mono">Document Information Content</Label>
                                        <span className="text-[8px] font-mono text-zinc-650 uppercase">Context Injector</span>
                                      </div>
                                      <Textarea
                                        placeholder="Paste or type supplementary document content here (e.g. engineering specs, validation logs, etc.)..."
                                        value={doc.information}
                                        onChange={(e) => handleUpdateExtraInfoDoc(doc.id, 'information', e.target.value)}
                                        className="flex-1 bg-zinc-950 border-zinc-850 text-zinc-200 focus:border-emerald-500 text-xs p-3.5 resize-none font-mono leading-relaxed h-full overflow-y-auto custom-scrollbar"
                                      />
                                    </div>
                                  </div>
                                );
                              })()
                            ) : (
                              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-zinc-500">
                                <FileText className="w-12 h-12 text-zinc-800 mb-3" />
                                <p className="text-xs">Select a document from the registry on the left to edit its contents, or add a new grounding document.</p>
                                <Button
                                  type="button"
                                  onClick={handleAddExtraInfoDoc}
                                  className="mt-4 bg-emerald-500 text-zinc-950 hover:bg-emerald-455 text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer animate-pulse"
                                >
                                  Add First Document
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant={isRecording ? "destructive" : "default"}
              size="sm"
              onClick={toggleRecording}
              disabled={!isSupported || isTranscribing || isAnalyzing}
              className={`gap-2 h-8.5 font-bold transition-all relative overflow-hidden shadow-lg ${
                isRecording 
                  ? 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.15)]' 
                  : 'bg-emerald-500 text-zinc-950 hover:bg-emerald-455 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] shadow-[0_4px_12px_rgba(16,185,129,0.15)] hover:scale-[1.02]'
              }`}
            >
              {isRecording ? <MicOff className="w-3.5 h-3.5 animate-pulse" /> : <Mic className="w-3.5 h-3.5" />}
              <span className="text-xs uppercase tracking-wide">
                {isRecording ? "Stop Recording" : "Record Answer"}
              </span>
            </Button>
          </div>
        </div>
      </header>
      {/* Main Workspace */}
      <main className="flex flex-1 overflow-y-auto lg:overflow-hidden p-4 gap-4 flex-col lg:flex-row bg-[#08080a]">
        {activeMode === 'default' ? (
          <>
            {/* Column 1: Live Transcript */}
            <section className="w-full lg:w-1/4 flex flex-col gap-3 min-h-[15vh] max-h-[40vh] lg:max-h-none lg:min-h-0 shrink-0 lg:shrink animate-in fade-in duration-200">
              <div className="flex items-center justify-between px-1.5">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2 font-heading">
                  <Activity className="w-3.5 h-3.5 text-zinc-500" />
                  Interview Transcript
                </h2>
                <div className="flex gap-2">
                  <button 
                    onClick={clearTranscript} 
                    className="text-[10px] text-zinc-650 hover:text-red-405 font-mono tracking-tight transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3 animate-spin-hover" /> Clear
                  </button>
                </div>
              </div>
              <div className="flex-1 bg-[#0c0c0e]/80 rounded-2xl border border-zinc-800/80 p-4 font-mono text-[13px] leading-relaxed overflow-hidden flex flex-col relative group shadow-md shadow-black/10">
                <div className="flex-1 -m-4 p-4 absolute inset-0 overflow-y-auto custom-scrollbar" ref={scrollRef}>
                  <div className="space-y-4 pb-12">
                    {transcript.length === 0 && !isTranscribing && (
                      <div className="flex flex-col items-center justify-center text-center p-8 h-full text-zinc-650 opacity-60 mt-16 space-y-3">
                        <Mic className="w-8 h-8 text-zinc-700 mx-auto" />
                        <p className="text-xs font-sans">Awaiting interview audio feed...</p>
                      </div>
                    )}

                    {transcript.map((msg, i) => {
                      const isRecent = i >= transcript.length - 2;
                      const isLast = i === transcript.length - 1;
                      const isEditing = editableTranscriptId === msg.id;

                      return (
                        <div key={msg.id} className={`space-y-1 group/msg ${!isRecent ? 'opacity-35' : ''}`}>
                          {isEditing ? (
                            <div className="flex flex-col gap-2">
                              <span className="text-[9px] font-bold text-zinc-500 font-mono">[{msg.role === 'candidate' ? 'YOU' : 'INTERVIEWER'}]: </span>
                              <Textarea
                                value={msg.text}
                                onChange={(e) => setTranscript(prev => prev.map(t => t.id === msg.id ? { ...t, text: e.target.value } : t))}
                                className="bg-zinc-950 border-emerald-500/50 text-zinc-350 focus:border-emerald-500 text-[13px] min-h-[100px] font-mono leading-relaxed"
                                autoFocus
                                onBlur={() => setEditableTranscriptId(null)}
                              />
                            </div>
                          ) : (
                            <div className="relative pr-6 group-hover/msg:bg-zinc-900/10 p-1.5 rounded transition-colors">
                              <span className="text-zinc-600 font-bold">[{msg.role === 'candidate' ? 'YOU' : 'INT'}]: </span>
                              <span className="text-zinc-300 font-mono">{msg.text}</span>
                              {isLast && !isAnalyzing && (
                                <button
                                  onClick={() => setEditableTranscriptId(msg.id)}
                                  className="absolute top-1.5 right-1 p-1 text-zinc-500 hover:text-emerald-400 opacity-0 group-hover/msg:opacity-100 transition-opacity cursor-pointer"
                                  title="Edit Transcript"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {isRecording && (
                      <div className="space-y-1 mt-4 animate-pulse">
                        <p className="flex items-center gap-1.5 text-xs text-red-400 font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                          <span className="text-zinc-650">[{isRecording ? 'YOU' : '...'}]: </span>
                          <span className="text-zinc-400 italic">Listening to audio input stream...</span>
                        </p>
                      </div>
                    )}
                    {isTranscribing && (
                      <div className="space-y-1 mt-4">
                        <p className="flex items-center text-zinc-400 italic text-[11px] font-mono">
                          <Loader2 className="w-3 h-3 mr-2 animate-spin text-emerald-500" /> Decoupling audio package via OpenRouter...
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Column 2: Suggested Response (Primary) */}
            <section className="flex-1 flex flex-col gap-3 min-h-[70vh] lg:min-h-0 shrink-0 lg:shrink animate-in fade-in duration-200">
              <div className="flex items-center justify-between px-1.5">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2 font-heading">
                  <BrainCircuit className="w-4 h-4 text-emerald-500" />
                  Strategic Response
                </h2>
                <div className="flex gap-3 items-center">
                  {transcript.length > 0 && (
                    <button 
                      onClick={handleRetry} 
                      disabled={isAnalyzing} 
                      className="text-[9px] text-zinc-400 hover:text-emerald-400 border border-zinc-800 bg-[#0c0c0e] px-2.5 py-1 rounded-lg uppercase font-bold disabled:opacity-50 tracking-wide transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3 h-3" /> Retry Generation
                    </button>
                  )}
                  {isAnalyzing ? (
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={handleCancelAndReset}
                        className="text-[9px] text-red-450 hover:text-red-405 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-lg uppercase font-bold tracking-wide transition-colors flex items-center gap-1 cursor-pointer"
                        title="Press D key or click to Cancel reasoning and start new session"
                      >
                        Cancel [D]
                      </button>
                      <span className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-[9px] text-zinc-400 font-bold uppercase tracking-wide animate-pulse flex items-center gap-1.5">
                        <Loader2 className="w-2.5 h-2.5 animate-spin text-emerald-500" /> {copilotResponse ? 'Streaming advice...' : 'Analyzing problem...'}
                      </span>
                    </div>
                  ) : copilotResponse ? (
                    <span className="px-2.5 py-1 bg-emerald-500/5 border border-emerald-500/15 rounded-lg text-[9px] text-emerald-400 font-bold uppercase tracking-wide flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Grounded Response Ready
                    </span>
                  ) : null}
                </div>
              </div>
              
              <div className="flex-1 bg-[#0c0c0e]/80 rounded-2xl border border-emerald-500/15 shadow-[0_12px_40px_-20px_rgba(16,185,129,0.12)] flex flex-col p-6 overflow-hidden relative">
                <ScrollArea className="flex-1 -m-6 p-6 absolute inset-0 overflow-y-auto custom-scrollbar">

                  {!copilotResponse && !isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center text-center p-8 h-full text-zinc-650 italic text-sm mt-24 space-y-4">
                      <BrainCircuit className="w-12 h-12 text-zinc-800 mx-auto" />
                      <p className="font-sans text-xs">Waiting for audio transcript or hotkey to trigger Strategic Response Engine...</p>
                    </div>
                  ) : !copilotResponse && isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center text-center p-8 h-full text-zinc-550 text-xs mt-24 space-y-4">
                      <Loader2 className="w-9 h-9 animate-spin text-emerald-500/60 mx-auto" />
                      <p className="font-mono tracking-wide">COMPILING SOURCE DOCUMENTS & INJECTING GLOBAL CONTEXT...</p>
                    </div>
                  ) : (
                    <div className="mb-6 animate-in fade-in zoom-in-95 duration-200">
                      <MarkdownViewer markdown={copilotResponse?.answer || ''} />
                    </div>
                  )}
                </ScrollArea>
              </div>
            </section>

            {/* Column 3: Engine Telemetry (Right Sidebar) */}
            {metrics && (
              <section className="w-full lg:w-1/4 flex flex-col gap-4 min-h-[30vh] lg:min-h-0 shrink-0 animate-in fade-in duration-200">
                <div className="flex flex-col gap-3 shrink-0">
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2 px-1 font-heading">
                    <Activity className="w-3.5 h-3.5 text-emerald-500 shadow-[0_0_10px_#10b981]" />
                    Engine Telemetry
                  </h2>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
                    {/* Engine Latency Card */}
                    <div className="space-y-1 font-mono text-[10px]">
                      <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-bold block">Engine Latency</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-bold text-zinc-200">
                          {metrics.isReasoningComplete ? `${metrics.totalLatency.toFixed(2)}s` : `${metrics.transcriptionLatency.toFixed(2)}s`}
                        </span>
                        <span className="text-[7px] text-zinc-500 font-bold uppercase">Total</span>
                      </div>
                      <div className="text-[8px] text-zinc-650 flex flex-col mt-0.5">
                        <span>Audio Sync: {metrics.transcriptionLatency.toFixed(1)}s</span>
                        <span>Reasoning: {metrics.isReasoningComplete ? `${metrics.reasoningLatency.toFixed(1)}s` : 'running...'}</span>
                      </div>
                    </div>

                    {/* Throughput */}
                    <div className="space-y-1 font-mono text-[10px] pt-3 border-t border-zinc-800/60">
                      <span className="text-[8px] uppercase tracking-widest text-emerald-500 font-bold block">Throughput</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-bold text-emerald-400">
                          {metrics.isReasoningComplete ? `${metrics.reasoningWps.toFixed(1)}` : '-'}
                        </span>
                        <span className="text-[7px] text-emerald-600 font-bold uppercase">wps</span>
                      </div>
                      <div className="text-[8px] text-zinc-650 mt-1">
                        <span>Response size: {metrics.isReasoningComplete ? `${metrics.reasoningWords} words` : '-'}</span>
                      </div>
                    </div>

                    {/* Speech Telemetry */}
                    <div className="space-y-1 font-mono text-[10px] pt-3 border-t border-zinc-800/60">
                      <span className="text-[8px] uppercase tracking-widest text-cyan-500 font-bold block">Speech Telemetry</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-bold text-cyan-400">{metrics.transcriptionWps.toFixed(1)}</span>
                        <span className="text-[7px] text-cyan-600 font-bold uppercase">wps</span>
                      </div>
                      <div className="text-[8px] text-zinc-650 mt-1">
                        <span>Audio source: {metrics.transcriptionWords} words</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </>
        ) : (
          /* Deep Dive Mode: Only one large panel targeting OpenAI frontier model */
          <section className="flex-1 flex flex-col gap-4 min-h-0 w-full max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] animate-pulse" />
                <h2 className="text-sm font-black uppercase tracking-widest text-emerald-400 font-heading">
                  Systems Integrator Deep Dive
                </h2>
              </div>
              <div className="flex gap-3 items-center">
                {transcript.length > 0 && copilotResponse && (
                  <button
                    onClick={handleDeepDive}
                    disabled={isDeepDiveAnalyzing}
                    className="text-[9px] text-zinc-405 hover:text-emerald-400 border border-zinc-800 bg-[#0c0c0e] px-3 py-1.5 rounded-lg uppercase font-bold disabled:opacity-50 tracking-wide transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isDeepDiveAnalyzing ? 'animate-spin' : ''}`} />
                    {deepDiveResponse ? 'Regenerate POV' : 'Run Deep Dive'}
                  </button>
                )}
                {isDeepDiveAnalyzing && (
                  <span className="px-2.5 py-1 bg-emerald-500/5 border border-emerald-500/15 rounded-lg text-[9px] text-emerald-400 font-bold uppercase tracking-wide animate-pulse flex items-center gap-1.5">
                    <Loader2 className="w-2.5 h-2.5 animate-spin text-emerald-500" /> Querying OpenAI Frontier Model...
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 bg-[#0c0c0e]/80 rounded-2xl border border-emerald-500/15 shadow-[0_12px_40px_-20px_rgba(16,185,129,0.12)] flex flex-col p-6 overflow-hidden relative">
              <ScrollArea className="flex-1 -m-6 p-6 absolute inset-0 overflow-y-auto custom-scrollbar">
                {transcript.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center p-8 h-full text-zinc-600 italic text-sm mt-32 space-y-4">
                    <Mic className="w-12 h-12 text-zinc-800 mx-auto" />
                    <p className="font-sans text-xs">Awaiting interview audio or transcript to initiate Deep Dive analysis...</p>
                  </div>
                ) : !copilotResponse ? (
                  <div className="flex flex-col items-center justify-center text-center p-8 h-full text-zinc-600 italic text-sm mt-32 space-y-4">
                    <BrainCircuit className="w-12 h-12 text-zinc-800 mx-auto" />
                    <p className="font-sans text-xs">Please generate a Strategic Response in Default Mode first before running Deep Dive.</p>
                  </div>
                ) : !deepDiveResponse && !isDeepDiveAnalyzing ? (
                  <div className="flex flex-col items-center justify-center text-center p-8 h-full text-zinc-550 italic text-sm mt-24 space-y-4">
                    <BrainCircuit className="w-12 h-12 text-zinc-800 mx-auto animate-pulse" />
                    <p className="font-sans text-xs">Ready to analyze question and response under strict JD grounding POV.</p>
                    <button
                      onClick={handleDeepDive}
                      className="bg-emerald-500 text-zinc-950 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-emerald-455 transition-all shadow-lg shadow-emerald-500/20"
                    >
                      Trigger Deep Dive POV
                    </button>
                    <div className="bg-zinc-950/60 border border-zinc-850 p-4 rounded-xl max-w-xl text-left font-mono text-[10px] text-zinc-500 space-y-2 mt-4">
                      <span className="font-bold text-zinc-400 block mb-1">Deep Dive Inputs:</span>
                      <div>• Last Question: "{transcript.filter(t => t.role === 'interviewer').slice(-1)[0]?.text || transcript[transcript.length - 1]?.text}"</div>
                      <div className="truncate">• JD Grounding: {context.jobDescription ? `${context.jobDescription.slice(0, 100)}...` : <span className="text-red-400">Missing! (Configure in Grounding Panel)</span>}</div>
                    </div>
                  </div>
                ) : !deepDiveResponse && isDeepDiveAnalyzing ? (
                  <div className="flex flex-col items-center justify-center text-center p-8 h-full text-zinc-550 text-xs mt-32 space-y-4">
                    <Loader2 className="w-9 h-9 animate-spin text-emerald-500/60 mx-auto" />
                    <p className="font-mono tracking-wide">ALIGNING WITH ENTERPRISE ARCHITECTURE & COMPLIANCE STANDARD METHODOLOGIES...</p>
                  </div>
                ) : (
                  <div className="mb-6 animate-in fade-in zoom-in-95 duration-200">
                    <MarkdownViewer markdown={deepDiveResponse} />
                  </div>
                )}
              </ScrollArea>
            </div>
          </section>
        )}
      </main>

      {/* Bottom Control Rail */}
      <footer className="h-12 bg-zinc-900 border-t border-zinc-800 px-6 flex items-center justify-between shrink-0">
        <div className="flex gap-4 sm:gap-6">
          <button
            onClick={() => setActiveMode('default')}
            className={`text-[10px] uppercase font-bold tracking-widest transition-colors cursor-pointer outline-none ${
              activeMode === 'default' ? 'text-emerald-400 hover:text-emerald-300' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Default Mode
          </button>
          <button
            onClick={() => setActiveMode('deep-dive')}
            className={`text-[10px] uppercase font-bold tracking-widest transition-colors cursor-pointer outline-none ${
              activeMode === 'deep-dive' ? 'text-emerald-400 hover:text-emerald-300' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Deep Dive
          </button>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest">System Status</span>
          <div className="flex gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${isSupported ? 'bg-emerald-500' : 'bg-red-500'}`} title="Mic Supported"></div>
            <div className={`w-1.5 h-1.5 rounded-full ${isRecording ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-700'}`} title="Recording"></div>
            <div className={`w-1.5 h-1.5 rounded-full ${isTranscribing ? 'bg-blue-500 animate-pulse' : 'bg-zinc-700'}`} title="Transcribing"></div>
            <div className={`w-1.5 h-1.5 rounded-full ${isAnalyzing ? 'bg-amber-500 animate-pulse' : 'bg-zinc-700'}`} title="Analyzing"></div>
          </div>
        </div>
      </footer>
    </div>
  );
}
