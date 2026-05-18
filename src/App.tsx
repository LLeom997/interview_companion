import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Settings, Briefcase, User, FileText, BrainCircuit, RefreshCw, Activity, Loader2, Edit2, Play, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

import { useAudioRecorder } from './hooks/useAudioRecorder';
import { askReasoningModelStream, transcribeAudio, CopilotContext, CopilotResponse, DEFAULT_WHIRLPOOL_DOCUMENT } from './services/openRouterService';
import { blobToAudioBuffer, audioBufferToWav } from './utils/audioConverter';

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

const formatMarkdown = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-emerald-400">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
};

export default function App() {
  const [context, setContext] = useState<CopilotContext>(() => {
    const saved = localStorage.getItem('interview_copilot_context');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.whirlpoolDocument) {
          parsed.whirlpoolDocument = DEFAULT_WHIRLPOOL_DOCUMENT;
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
      extraInfo: '',
      whirlpoolDocument: DEFAULT_WHIRLPOOL_DOCUMENT
    };
  });

  useEffect(() => {
    localStorage.setItem('interview_copilot_context', JSON.stringify(context));
  }, [context]);

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

  const { isRecording, startRecording, stopRecording, toggleRecording, isSupported } = useAudioRecorder(handleRecordingComplete);

  const handleCancelAndReset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (isRecording) {
      stopRecording();
    }
    setIsAnalyzing(false);
    setIsTranscribing(false);
    setCopilotResponse(null);
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
    <div className="flex flex-col h-screen bg-[#09090b] text-zinc-100 font-sans overflow-hidden">
      {/* Top Navigation / Status Bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#0c0c0e] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
          <h1 className="text-sm font-bold tracking-tight uppercase text-zinc-400">
            Copilot v2.5 <span className="text-zinc-600 ml-2 italic underline underline-offset-4 decoration-emerald-500/50 hidden sm:inline">OpenRouter Edition</span>
          </h1>
        </div>

        <div className="flex gap-4 sm:gap-8 items-center">
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest">Target Role</span>
            <span className="text-sm font-medium text-zinc-200 truncate max-w-[150px] md:max-w-[200px]">{context.targetRole || 'Not Set'}</span>
          </div>

          <div className="flex items-center gap-3">
            {!isSupported && (
              <Badge variant="destructive" className="hidden sm:inline-flex text-[10px]">Mic Not Supported</Badge>
            )}

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white">
                  <Settings className="w-4 h-4" /> <span className="hidden sm:inline">Context</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col bg-zinc-900 border-zinc-800 text-zinc-100">
                <DialogHeader>
                  <DialogTitle className="text-zinc-100 font-bold">Interview Context</DialogTitle>
                </DialogHeader>
                <div className="flex-1 pr-4 overflow-y-auto">
                  <div className="space-y-4 py-4">

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-zinc-400 uppercase text-[10px] font-bold tracking-widest"><User className="w-4 h-4 text-emerald-500" /> Target Role</Label>
                      <Input
                        placeholder="e.g. Senior Frontend Engineer"
                        value={context.targetRole}
                        onChange={(e) => handleContextChange('targetRole', e.target.value)}
                        className="bg-zinc-950 border-zinc-800 text-zinc-200 focus:border-emerald-500"
                      />
                    </div>

                    <details className="group border border-emerald-800/30 rounded-lg p-3 bg-zinc-950/50 open:bg-zinc-950 border-emerald-500/20 shadow-[0_0_15px_-3px_rgba(16,185,129,0.05)]">
                      <summary className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 cursor-pointer flex items-center justify-between outline-none">
                        <span className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-emerald-500" /> Whirlpool Experience Grounding
                        </span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full border border-emerald-500/30 text-emerald-400 bg-emerald-500/5 font-mono">
                          {context.whirlpoolDocument ? `${context.whirlpoolDocument.length} chars` : 'Empty'}
                        </span>
                      </summary>

                      <div className="mt-3 space-y-3">
                        <div className="flex justify-between items-center text-[10px] text-zinc-400 font-mono">
                          <span>Continuous document paste style context grounding</span>
                          <button
                            type="button"
                            onClick={handleRestoreDefaultDocument}
                            className="text-emerald-500 hover:text-emerald-400 font-semibold underline underline-offset-2 transition-colors cursor-pointer"
                          >
                            Restore Default Document
                          </button>
                        </div>

                        <Textarea
                          placeholder="Paste your Whirlpool projects, roles, contributions, impact, and decisions here as a single unified text document..."
                          value={context.whirlpoolDocument}
                          onChange={(e) => handleContextChange('whirlpoolDocument', e.target.value)}
                          className="resize-y bg-[#09090b] border-zinc-800 text-zinc-200 focus:border-emerald-500 text-[13px] font-mono leading-relaxed"
                          rows={15}
                        />
                      </div>
                    </details>

                    <details className="group border border-zinc-800 rounded-lg p-3 bg-zinc-950/50 open:bg-zinc-950">
                      <summary className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 cursor-pointer flex items-center gap-2 outline-none">
                        <Briefcase className="w-4 h-4 text-emerald-500" /> Company Info
                      </summary>
                      <div className="mt-3">
                        <Textarea
                          placeholder="Key values, culture, products..."
                          value={context.companyInfo}
                          onChange={(e) => handleContextChange('companyInfo', e.target.value)}
                          className="resize-none bg-[#09090b] border-zinc-800 text-zinc-200 focus:border-emerald-500"
                          rows={3}
                        />
                      </div>
                    </details>

                    <details className="group border border-zinc-800 rounded-lg p-3 bg-zinc-950/50 open:bg-zinc-950">
                      <summary className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 cursor-pointer flex items-center gap-2 outline-none">
                        <FileText className="w-4 h-4 text-emerald-500" /> Job Description
                      </summary>
                      <div className="mt-3">
                        <Textarea
                          placeholder="Paste the job description here..."
                          value={context.jobDescription}
                          onChange={(e) => handleContextChange('jobDescription', e.target.value)}
                          className="resize-none bg-[#09090b] border-zinc-800 text-zinc-200 focus:border-emerald-500"
                          rows={5}
                        />
                      </div>
                    </details>

                    <details className="group border border-zinc-800 rounded-lg p-3 bg-zinc-950/50 open:bg-zinc-950">
                      <summary className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 cursor-pointer flex items-center gap-2 outline-none">
                        <FileText className="w-4 h-4 text-emerald-500" /> Your Resume (Summary)
                      </summary>
                      <div className="mt-3">
                        <Textarea
                          placeholder="Paste your resume or key bullet points..."
                          value={context.resume}
                          onChange={(e) => handleContextChange('resume', e.target.value)}
                          className="resize-none bg-[#09090b] border-zinc-800 text-zinc-200 focus:border-emerald-500"
                          rows={6}
                        />
                      </div>
                    </details>

                    <details className="group border border-zinc-800 rounded-lg p-3 bg-zinc-950/50 open:bg-zinc-950">
                      <summary className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 cursor-pointer flex items-center gap-2 outline-none">
                        <FileText className="w-4 h-4 text-emerald-500" /> Extra Information
                      </summary>
                      <div className="mt-3">
                        <Textarea
                          placeholder="Any other context, specific projects, specific interview focus..."
                          value={context.extraInfo}
                          onChange={(e) => handleContextChange('extraInfo', e.target.value)}
                          className="resize-none bg-[#09090b] border-zinc-800 text-zinc-200 focus:border-emerald-500"
                          rows={3}
                        />
                      </div>
                    </details>

                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant={isRecording ? "destructive" : "default"}
              size="sm"
              onClick={toggleRecording}
              disabled={!isSupported || isTranscribing || isAnalyzing}
              className={`gap-2 font-bold ${isRecording ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-emerald-500 text-[#09090b] hover:bg-emerald-600'}`}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {isRecording ? "Stop Recording" : "Record Answer"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex flex-1 overflow-y-auto lg:overflow-hidden p-4 gap-4 flex-col lg:flex-row">

        {/* Column 1: Live Transcript */}
        <section className="w-full lg:w-1/4 flex flex-col gap-3 min-h-[12vh] max-h-[40vh] lg:max-h-none lg:min-h-0 shrink-0 lg:shrink">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <Activity className="w-3 h-3" />
              Interview Transcript
            </h2>
            <div className="flex gap-2">
              <button onClick={clearTranscript} className="text-[10px] text-zinc-600 font-mono italic hover:text-zinc-300 transition-colors flex items-center gap-1 ml-2">
                <RefreshCw className="w-3 h-3" /> Clear
              </button>
            </div>
          </div>
          <div className="flex-1 bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-4 font-mono text-[13px] leading-relaxed overflow-hidden flex flex-col relative group">
            <div className="flex-1 -m-4 p-4 absolute inset-0 overflow-y-auto" ref={scrollRef}>
              <div className="space-y-4 pb-12">
                {transcript.length === 0 && !isTranscribing && (
                  <div className="flex flex-col items-center justify-center text-center p-8 h-full text-zinc-600 opacity-60 mt-12">
                    <Mic className="w-8 h-8 mb-4 text-zinc-700" />
                    <p className="text-xs font-sans">Awaiting interview audio...</p>
                  </div>
                )}

                {transcript.map((msg, i) => {
                  const isRecent = i >= transcript.length - 2;
                  const isLast = i === transcript.length - 1;
                  const isEditing = editableTranscriptId === msg.id;

                  return (
                    <div key={msg.id} className={`space-y-1 group/msg ${!isRecent ? 'opacity-40' : ''}`}>
                      {isEditing ? (
                        <div className="flex flex-col gap-2">
                          <span className="text-zinc-600">[{msg.role === 'candidate' ? 'YOU' : 'INT'}]: </span>
                          <Textarea
                            value={msg.text}
                            onChange={(e) => setTranscript(prev => prev.map(t => t.id === msg.id ? { ...t, text: e.target.value } : t))}
                            className="bg-zinc-950 border-emerald-500/50 text-zinc-300 focus:border-emerald-500 text-[13px] min-h-[100px]"
                            autoFocus
                            onBlur={() => setEditableTranscriptId(null)}
                          />
                        </div>
                      ) : (
                        <div className="relative pr-6">
                          <span className="text-zinc-600">[{msg.role === 'candidate' ? 'YOU' : 'INT'}]: </span>
                          <span className="text-zinc-300">{msg.text}</span>
                          {isLast && !isAnalyzing && (
                            <button
                              onClick={() => setEditableTranscriptId(msg.id)}
                              className="absolute top-0 right-0 p-1 text-zinc-500 hover:text-emerald-400 opacity-0 group-hover/msg:opacity-100 transition-opacity"
                              title="Edit Transcript"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}

                {isRecording && (
                  <div className="space-y-1 mt-4">
                    <p>
                      <span className="text-zinc-600">[...]: </span>
                      <span className="text-zinc-400 italic">Recording...</span>
                      <span className="w-1 h-3 bg-red-500 inline-block ml-1 animate-pulse align-middle"></span>
                    </p>
                  </div>
                )}
                {isTranscribing && (
                  <div className="space-y-1 mt-4">
                    <p className="flex items-center text-zinc-400 italic text-xs">
                      <Loader2 className="w-3 h-3 mr-2 animate-spin" /> Transcribing via OpenRouter...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Column 2: Suggested Response (Primary) */}
        <section className="flex-1 flex flex-col gap-3 min-h-[70vh] lg:min-h-0 shrink-0">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
              <BrainCircuit className="w-3 h-3 text-emerald-500" />
              Strategic Response
            </h2>
            <div className="flex gap-3 items-center">
              {transcript.length > 0 && (
                <button onClick={handleRetry} disabled={isAnalyzing} className="text-[10px] text-zinc-300 hover:text-emerald-400 transition-colors flex items-center gap-1 uppercase font-bold disabled:opacity-50 bg-zinc-800 px-2 py-1 rounded-md">
                  <Play className="w-3 h-3" /> Retry
                </button>
              )}
              {isAnalyzing ? (
                <div className="flex gap-2 items-center">
                  <button
                    onClick={handleCancelAndReset}
                    className="text-[9px] text-red-400 hover:text-red-300 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded uppercase font-bold tracking-tighter transition-colors flex items-center gap-1 cursor-pointer"
                    title="Press D key or click to Cancel reasoning and start new session"
                  >
                    Cancel [D]
                  </button>
                  <span className="px-2 py-0.5 bg-zinc-800 rounded-full text-[9px] text-zinc-400 font-bold uppercase tracking-tighter animate-pulse flex items-center gap-1">
                    <Loader2 className="w-2 h-2 animate-spin" /> {copilotResponse ? 'Streaming' : 'Generating'}
                  </span>
                </div>
              ) : copilotResponse ? (
                <span className="px-2 py-0.5 bg-zinc-800 rounded-full text-[9px] text-emerald-400 font-bold uppercase tracking-tighter flex items-center gap-1">
                  Ready
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex-1 bg-zinc-900 rounded-2xl border border-emerald-500/20 shadow-[0_0_50px_-12px_rgba(16,185,129,0.15)] flex flex-col p-6 overflow-hidden relative">
            <ScrollArea className="flex-1 -m-6 p-6 absolute inset-0 overflow-y-auto">
              {!copilotResponse && !isAnalyzing ? (
                <div className="flex flex-col items-center justify-center text-center p-8 h-full text-zinc-600 font-serif italic text-sm mt-20">
                  "Provide context and start recording to generate strategic advice..."
                </div>
              ) : !copilotResponse && isAnalyzing ? (
                <div className="flex flex-col items-center justify-center text-center p-8 h-full text-zinc-500 text-sm mt-20">
                  <Loader2 className="w-8 h-8 animate-spin mb-4 text-emerald-500 opacity-50" />
                  Generating senior engineering response...
                </div>
              ) : (
                <div className="mb-6 animate-in fade-in zoom-in-95 duration-200">
                  <div className="whitespace-pre-wrap text-zinc-200 text-[13px] leading-relaxed font-sans">
                    {formatMarkdown(copilotResponse?.answer || '')}
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>
        </section>

        {/* Column 3: Context & Insights */}
        <section className="w-full lg:w-1/4 flex flex-col gap-4 min-h-[30vh] lg:min-h-0 shrink-0">
          {/* Metrics Panel */}
          {metrics && (
            <div className="flex flex-col gap-3">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2 px-1">Performance KPIs</h2>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3 font-mono text-[10px]">
                <div>
                  <p className="text-zinc-500 uppercase tracking-widest mb-1">Transcription</p>
                  <div className="flex justify-between text-zinc-300"><span>Latency:</span> <span>{metrics.transcriptionLatency.toFixed(2)}s</span></div>
                  <div className="flex justify-between text-zinc-300"><span>Words:</span> <span>{metrics.transcriptionWords}</span></div>
                  <div className="flex justify-between text-zinc-300"><span>Throughput:</span> <span>{metrics.transcriptionWps.toFixed(2)} wps</span></div>
                </div>
                <div className="h-px w-full bg-zinc-800"></div>
                <div>
                  <p className="text-zinc-500 uppercase tracking-widest mb-1">Reasoning</p>
                  <div className="flex justify-between text-zinc-300"><span>Latency:</span> <span>{metrics.isReasoningComplete ? `${metrics.reasoningLatency.toFixed(2)}s` : 'Measuring...'}</span></div>
                  <div className="flex justify-between text-zinc-300"><span>Words:</span> <span>{metrics.isReasoningComplete ? metrics.reasoningWords : '-'}</span></div>
                  <div className="flex justify-between text-zinc-300"><span>Throughput:</span> <span>{metrics.isReasoningComplete ? `${metrics.reasoningWps.toFixed(2)} wps` : '-'}</span></div>
                </div>
                <div className="h-px w-full bg-zinc-800"></div>
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Total Latency:</span> <span>{metrics.isReasoningComplete ? `${metrics.totalLatency.toFixed(2)}s` : 'N/A'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Context Panel */}
          <div className="flex flex-col gap-3 flex-1 overflow-hidden">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2 px-1">Memory</h2>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex-1 space-y-4 overflow-y-auto">
              <div className="space-y-2">
                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Company Info</p>
                <div className="text-xs bg-[#0c0c0e] p-2 rounded border border-zinc-800 text-zinc-400">
                  {context.companyInfo || 'No company info set'}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Job Description Snippet</p>
                <div className="text-xs text-zinc-500 italic line-clamp-3">
                  {context.jobDescription || 'No job description provided.'}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Target Role</p>
                <div className="text-xs text-zinc-500 italic line-clamp-3">
                  {context.targetRole || 'Not provided.'}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" /> Whirlpool Grounding
                </p>
                <div className="text-xs bg-[#0c0c0e] p-2 rounded border border-zinc-800/80 text-zinc-300 relative">
                  {context.whirlpoolDocument && context.whirlpoolDocument.trim() ? (
                    <>
                      <div className="flex justify-between items-center mb-1 pb-1 border-b border-zinc-800/60">
                        <span className="font-mono text-[9px] uppercase tracking-tighter text-zinc-500">Continuous Document</span>
                        <span className="text-[8px] uppercase tracking-tighter px-1.5 py-0.25 rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold">Grounded</span>
                      </div>
                      <div className="text-zinc-400 italic line-clamp-4 font-mono text-[11px] whitespace-pre-line">
                        {context.whirlpoolDocument}
                      </div>
                      <div className="mt-1 text-[9px] text-zinc-600 text-right font-mono">
                        {context.whirlpoolDocument.length} characters
                      </div>
                    </>
                  ) : (
                    <span className="text-zinc-600 italic">No Whirlpool experience loaded.</span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Extra Information</p>
                <div className="text-xs text-zinc-500 italic line-clamp-2">
                  {context.extraInfo || 'None provided.'}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Bottom Control Rail */}
      <footer className="h-12 bg-zinc-900 border-t border-zinc-800 px-6 flex items-center justify-between shrink-0">
        <div className="flex gap-4 sm:gap-6">
          <button className="text-[10px] uppercase font-bold text-emerald-400 hover:text-emerald-300">Default Mode</button>
          <button className="text-[10px] uppercase font-bold text-zinc-500 hover:text-zinc-300">Deep Dive</button>
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
