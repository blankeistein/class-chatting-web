import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  UploadCloud,
  Wand2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  X,
  ChevronRight,
  RefreshCw,
  Search,
  Sparkles,
  Key,
  Settings,
  Save,
  Hash
} from 'lucide-react';
import {
  Button,
  IconButton,
  Typography,
  Input,
  Card,
  Navbar,
  Dialog,
  Tabs,
  Spinner,
  Chip
} from "@material-tailwind/react";

const MODEL_NAME = "gemini-2.5-flash-preview-09-2025";

const fileToGenerativePart = async (file: File) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const LoadingStep = ({ icon: Icon, text, status }: { icon: React.ComponentType<{ size?: number }>, text: string, status: 'waiting' | 'active' | 'completed' }) => {
  return (
    <div className={`flex items-center space-x-4 p-3 rounded-xl transition-all duration-500 ${status === 'waiting' ? 'opacity-60' : 'opacity-100 bg-white/5'}`}>
      <div className={`p-2.5 rounded-lg transition-colors duration-300 ${status === 'completed' ? 'bg-green-500/10 text-success' :
        status === 'active' ? 'bg-info/10 text-info' :
          'bg-background text-primary'
        }`}>
        {status === 'completed' ? <CheckCircle2 size={20} /> :
          status === 'active' ? <Spinner className="h-5 w-5" /> :
            <Icon size={20} />}
      </div>
      <Typography type="small" className={`font-medium ${status === 'active' ? 'text-info' : status === 'completed' ? 'text-success' : 'text-primary'}`}>
        {text}
      </Typography>
    </div>
  );
};

interface ErrorItem { id: number; page: number; type: string; severity: string; original: string; suggestion: string; explanation: string; context: string }

export default function PenAI() {
  // STATE
  const [view, setView] = useState<'upload' | 'analyzing' | 'results' | 'error'>('upload');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [showSettings, setShowSettings] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [errors, setErrors] = useState<ErrorItem[]>([]);
  const [selectedError, setSelectedError] = useState<ErrorItem | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [analysisStep, setAnalysisStep] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Effect: Cleanup file URL
  useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    };
  }, [fileUrl]);

  const saveApiKey = (key: string) => {
    const cleanedKey = key.trim();
    localStorage.setItem('gemini_api_key', cleanedKey);
    setApiKey(cleanedKey);
    setShowSettings(false);
  };

  // Handle File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const uploadedFile = (e as React.DragEvent).dataTransfer?.files?.[0] || (e.target as HTMLInputElement).files?.[0];

    if (!apiKey) {
      setShowSettings(true);
      return;
    }

    if (uploadedFile) {
      if (uploadedFile.type !== 'application/pdf' && uploadedFile.type !== 'text/plain') {
        alert("Mohon upload file PDF atau TXT.");
        return;
      }
      setFile(uploadedFile);
      const url = URL.createObjectURL(uploadedFile);
      setFileUrl(url);
      await processFileWithGemini(uploadedFile);
    }
  };

  const processFileWithGemini = async (file: File) => {
    setView('analyzing');
    setAnalysisStep(1);

    try {
      const filePart = await fileToGenerativePart(file);
      setAnalysisStep(2);

      const prompt = `
        You are a professional English Editor and Proofreader.
        Task:
        1. Extract the full text from the attached file exactly as it appears.
        2. Analyze the text for grammar, spelling, punctuation, and clarity errors.
        3. Identify the page number where each error occurs based on the visual layout or context.
        4. Return a JSON object strictly following this schema:
        {
          "errors": [
            {
              "id": 1,
              "page": 1,
              "type": "grammar" | "spelling" | "clarity",
              "severity": "high" | "medium" | "low",
              "original": "exact text segment causing error",
              "suggestion": "corrected text",
              "explanation": "brief explanation in Bahasa Indonesia",
              "context": "surrounding text (approx 5-10 words)"
            }
          ]
        }
        Do not use markdown code blocks. Return raw JSON only.
      `;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }, filePart]
            }],
            generationConfig: { responseMimeType: "application/json" }
          })
        }
      );

      if (!response.ok) {
        if (response.status === 400 || response.status === 403) {
          throw new Error("API Key tidak valid atau expired. Silakan periksa pengaturan.");
        }
        throw new Error(`API Error: ${response.statusText}`);
      }

      setAnalysisStep(3);

      const result = await response.json();
      const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) throw new Error("No response from AI");

      const parsedData = JSON.parse(generatedText);
      setText(parsedData.fullText || "Gagal mengekstrak teks.");
      const formattedErrors = (parsedData.errors || []).map((err: any, idx: number) => ({
        ...err,
        id: idx + 1
      }));

      setErrors(formattedErrors);
      setTimeout(() => setView('results'), 800);

    } catch (err) {
      console.error(err);
      if (err instanceof Error) {
        setErrorMessage(err.message || "Terjadi kesalahan saat menghubungi AI.");
      }
      setView('error');
    }
  };

  const applyFix = (errorId: number) => {
    const error = errors.find(e => e.id === errorId);
    if (!error) return;
    setText(prev => prev.replace(error.original, error.suggestion));
    setErrors(prev => prev.filter(e => e.id !== errorId));
    setSelectedError(null);
  };

  const getFilteredErrors = () => {
    if (activeTab === 'all') return errors;
    return errors.filter(e => e.type === activeTab);
  };

  // --- UI COMPONENTS ---

  const ApiKeyModal = () => {
    const [inputKey, setInputKey] = useState(apiKey);
    return (
      <Dialog open={showSettings} onOpenChange={setShowSettings} size="sm">
        <Dialog.Overlay>
          <Dialog.Content>
            <div className="flex justify-between items-center mb-4">
              <Typography type="h5" className="flex items-center gap-2 font-bold">
                <Key className="text-info" size={20} />
                API Settings
              </Typography>
              <IconButton variant="ghost" color="secondary" onClick={() => setShowSettings(false)}>
                <X className="w-5 h-5" />
              </IconButton>
            </div>

            <Typography className="mb-6 font-normal text-primary/60">
              Pena AI uses Google Gemini to analyze your documents. Your API key is stored only on your browser.
            </Typography>

            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <Typography type="small" as="label" htmlFor="apiKey">
                  Api Key
                </Typography>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Google AI Studio Key (AIza...)"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                />
              </div>
              <Button
                variant="ghost"
                color="info"
                size="sm"
                className="flex items-center gap-2 normal-case justify-center"
                onClick={() => window.open('https://aistudio.google.com/app/apikey', '_blank')}
              >
                Get API Key here
              </Button>
            </div>

            <div className="flex justify-end gap-2 mt-8">
              <Button variant="ghost" color="primary" onClick={() => setShowSettings(false)}>
                Cancel
              </Button>
              <Button
                variant="solid"
                color="info"
                onClick={() => saveApiKey(inputKey)}
                disabled={!inputKey}
                className="flex items-center gap-2"
              >
                <Save size={16} /> Save Key
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog>
    );
  };

  const Header = () => (
    <Navbar className="backdrop-blur-md border-b px-6 py-3 sticky top-0 z-50 rounded-none shadow-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('upload')}>
          <div className="bg-info p-2 rounded-xl shadow-lg shadow-info/20">
            <BookOpen className="text-background" size={24} />
          </div>
          <Typography type="h6" className="font-bold tracking-tight">
            Pena AI
          </Typography>
        </div>
        <div className="flex items-center gap-3">
          <IconButton
            variant="ghost"
            title="API Settings"
            className={apiKey ? "text-primary" : "text-warning animate-pulse"}
            onClick={() => setShowSettings(true)}
          >
            <Settings size={20} />
          </IconButton>
        </div>
      </div>
    </Navbar>
  );

  const UploadView = () => (
    <div className="container mx-auto px-4 py-8 flex flex-col items-center">
      <div className="text-center mb-8 max-w-2xl">
        <Typography type="h2" className="mb-4 font-bold">
          AI-Powered <span className="text-info">Proofreading</span>
        </Typography>
        <Typography className="text-primary text-lg">
          Upload your PDF or text documents for deep linguistic analysis using Gemini Flash.
        </Typography>
      </div>

      <Card
        className="w-full max-w-xl border-2 border-dashed border-primary hover:border-info transition-all duration-300 cursor-pointer group rounded-2xl"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFileUpload}
      >
        <div className="flex flex-col items-center py-16">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 group-hover:border group-hover:bg-primary transition-colors duration-300">
            <UploadCloud className="text-primary group-hover:text-secondary" size={32} />
          </div>
          <Typography type="h5" className="mb-2 text-primary font-bold">
            Drop your document here
          </Typography>
          <Typography className="text-primary/50 mb-8">
            Supports PDF and TXT files
          </Typography>
          <Button
            as="label"
            variant="solid"
            color="info"
            className="flex items-center gap-2 px-8 py-3"
          >
            <Search className="w-5 h-5" /> Browse Files
            <input type="file" className="hidden" accept=".pdf,.txt" onChange={handleFileUpload} />
          </Button>
        </div>
      </Card>

      {!apiKey && (
        <Card className="mt-8 max-w-md bg-warning/10 border border-warning/20 p-4">
          <div className="flex items-center gap-3 text-warning">
            <AlertTriangle size={20} />
            <Typography type="small" color="inherit" className="font-medium">API Key not set. Click settings to configure.</Typography>
          </div>
        </Card>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-secondary selection:bg-info/30">
      <Header />
      <main className="relative">
        {view === 'upload' && <UploadView />}

        {view === 'analyzing' && (
          <div className="flex flex-col items-center justify-center min-h-[80vh]">
            <div className="relative mb-12">
              <div className="absolute inset-0 bg-info blur-[80px] opacity-20 rounded-full animate-pulse" />
              <Spinner className="h-24 w-24 text-info" />
            </div>
            <Typography type="h3" className="mb-8 font-bold">Analyzing Content...</Typography>
            <div className="w-full max-w-sm space-y-3">
              <LoadingStep icon={FileText} text="Processing document data" status={analysisStep >= 1 ? (analysisStep > 1 ? 'completed' : 'active') : 'waiting'} />
              <LoadingStep icon={UploadCloud} text="Communicating with Gemini AI" status={analysisStep >= 2 ? (analysisStep > 2 ? 'completed' : 'active') : 'waiting'} />
              <LoadingStep icon={Wand2} text="Running proofreading algorithms" status={analysisStep >= 3 ? (analysisStep > 3 ? 'completed' : 'active') : 'waiting'} />
            </div>
          </div>
        )}

        {view === 'error' && (
          <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
            <Card className="max-w-md bg-error/10 border border-error/20 p-6 mb-8 text-center">
              <AlertTriangle className="mx-auto text-error mb-4" size={40} />
              <Typography type="h6" className="text-white font-bold mb-2">Analysis Failed</Typography>
              <Typography type="small" className="text-slate-400">{errorMessage}</Typography>
            </Card>
            <div className="flex gap-4">
              <Button variant="ghost" color="secondary" onClick={() => setShowSettings(true)}>Settings</Button>
              <Button color="info" variant="solid" onClick={() => setView('upload')}>Try Again</Button>
            </div>
          </div>
        )}

        {view === 'results' && (
          <div className="flex h-[calc(100vh-68px)]">
            {/* PREVIEW */}
            {fileUrl && (
              <div className="flex-1 bg-slate-900 overflow-hidden relative border-r border-slate-800">
                <iframe src={fileUrl} className="w-full h-full border-none" title="Original Document" />
                <div className="absolute top-4 left-4 flex gap-2">
                  <Chip variant="solid" color="info" className="rounded-md">
                    <Chip.Label>Original Preview</Chip.Label>
                  </Chip>
                </div>
              </div>
            )}

            {/* ERROR LIST */}
            <div className="w-[400px] flex flex-col bg-background">
              <div className="p-6 border-b border-secondary">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <Typography type="h5" className="font-bold flex items-center gap-2 text-primary">
                      <Sparkles className="text-info" size={20} />
                      Issues
                    </Typography>
                    <Typography type="small" className="text-primary/60">
                      Found {errors.length} suggestions
                    </Typography>
                  </div>
                  <IconButton variant="ghost" color="primary" onClick={() => setView('upload')} size="sm">
                    <RefreshCw size={16} />
                  </IconButton>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <Tabs.List>
                    {['all', 'grammar', 'spelling', 'punctuation', 'clarity'].map((t) => (
                      <Tabs.Trigger key={t} value={t} className="py-2 capitalize text-xs font-bold">
                        {t}
                      </Tabs.Trigger>
                    ))}
                    <Tabs.TriggerIndicator className="bg-info/10" />
                  </Tabs.List>
                </Tabs>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {getFilteredErrors().length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <CheckCircle2 size={48} className="text-success mb-4" />
                    <Typography className="text-primary">No issues found!</Typography>
                  </div>
                ) : (
                  getFilteredErrors().map((err) => (
                    <Card
                      key={err.id}
                      onClick={() => setSelectedError(err)}
                      className={`cursor-pointer transition-all duration-200 border rounded-xl overflow-hidden ${selectedError?.id === err.id
                        ? 'bg-info/5 border-info shadow-lg'
                        : 'bg-background border-secondary hover:border-info'
                        }`}
                    >
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex gap-2">
                            <Chip
                              size="sm"
                              variant="ghost"
                              color={err.type === 'grammar' ? 'error' : err.type === 'spelling' ? 'info' : 'warning'}
                              className="text-[10px] uppercase font-black"
                            >
                              <Chip.Label>{err.type}</Chip.Label>
                            </Chip>
                            {err.page && (
                              <Chip
                                size="sm"
                                variant="outline"
                                color="secondary"
                                className="text-[10px] uppercase border-surface text-primary"
                              >
                                <Chip.Label className="flex items-center gap-1">
                                  <Hash size={10} /> Page {err.page}
                                </Chip.Label>
                              </Chip>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-3 bg-primary/10 p-2 rounded-lg">
                          <Typography type="small" color="error" className="opacity-80 line-through truncate flex-1">
                            {err.original}
                          </Typography>
                          <ChevronRight size={14} className="text-secondary/80 shrink-0" />
                          <Typography type="small" color="success" className="font-bold flex-1">
                            {err.suggestion}
                          </Typography>
                        </div>

                        <Typography type="small" className="text-primary leading-snug mb-3">
                          {err.explanation}
                        </Typography>

                        {selectedError?.id === err.id && (
                          <Button
                            size="sm"
                            color="success"
                            variant="solid"
                            className="flex items-center justify-center gap-2 w-full mt-2"
                            onClick={(e) => { e.stopPropagation(); applyFix(err.id); }}
                          >
                            <CheckCircle2 size={14} /> Tandai sudah diperbaiki
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      {showSettings && <ApiKeyModal />}
    </div>
  );
}