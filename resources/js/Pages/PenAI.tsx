import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen, UploadCloud, Wand2, CheckCircle2, AlertTriangle,
  FileText, X, ChevronRight, Cpu, Download, RefreshCw,
  Search, Sparkles, Loader2, Key, Settings, Save, Eye, Columns,
  Hash
} from 'lucide-react';

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
    <div className={`flex items-center space-x-3 transition-opacity duration-500 ${status === 'waiting' ? 'opacity-30' : 'opacity-100'}`}>
      <div className={`p-2 rounded-full transition-colors duration-300 ${status === 'completed' ? 'bg-green-500/20 text-green-400' :
        status === 'active' ? 'bg-blue-500/20 text-blue-400 animate-pulse' :
          'bg-slate-800 text-slate-600'
        }`}>
        {status === 'completed' ? <CheckCircle2 size={18} /> : <Icon size={18} />}
      </div>
      <span className={`${status === 'active' ? 'text-white font-medium' : status === 'completed' ? 'text-slate-400' : 'text-slate-600'}`}>
        {text}
      </span>
    </div>
  );
};

interface ErrorItem { id: number; page: number; type: string; severity: string; original: string; suggestion: string; explanation: string; context: string }

export default function App() {
  // STATE
  const [view, setView] = useState<'upload' | 'analyzing' | 'results' | 'error'>('upload'); // upload, analyzing, results, error
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [showSettings, setShowSettings] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null); // URL untuk iframe PDF
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
    // let uploadedFile;
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
      // Buat URL objek untuk ditampilkan di iframe
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
          "fullText": "The complete extracted text...",
          "errors": [
            {
              "id": 1,
              "page": 1, // integer, the page number
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
      const formattedErrors = (parsedData.errors || []).map((err: string[], idx: number) => ({
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

  // --- SUB-COMPONENTS ---
  const ApiKeyModal = () => {
    const [inputKey, setInputKey] = useState(apiKey);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Key className="text-emerald-500" size={20} />
              Pengaturan API Key
            </h3>
            <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white">
              <X size={20} />
            </button>
          </div>
          <div className="p-6">
            <p className="text-slate-400 text-sm mb-4">
              Untuk menggunakan Pena AI, Anda memerlukan API Key dari Google Gemini.
              Key ini akan disimpan secara lokal di browser Anda.
            </p>
            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Google AI Studio Key</label>
              <input
                type="password"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="Paste API Key disini (AIza...)"
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>
            <div className="flex gap-3">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
              >
                Dapatkan Key
              </a>
              <button
                onClick={() => saveApiKey(inputKey)}
                disabled={!inputKey}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold transition flex items-center justify-center gap-2"
              >
                <Save size={16} />
                Simpan
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const Header = () => (
    <nav className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
      <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setView('upload')}>
        <div className="bg-emerald-600 p-2 rounded-lg">
          <BookOpen className="text-white" size={24} />
        </div>
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-blue-400">
          Pena AI <span className="text-xs font-mono text-slate-500 ml-2 border border-slate-700 rounded px-1">V2.2 Page Nav</span>
        </span>
      </div>
      <div className="flex space-x-4 items-center">
        <button
          onClick={() => setShowSettings(true)}
          className={`flex items-center px-3 py-1.5 rounded-full border text-xs font-medium transition ${apiKey
            ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'
            : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500 animate-pulse'
            }`}
        >
          {apiKey ? <Settings size={14} className="mr-2" /> : <Key size={14} className="mr-2" />}
          {apiKey ? 'Settings' : 'Set API Key'}
        </button>
        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
          <span className="text-xs font-bold text-slate-300">DK</span>
        </div>
      </div>
    </nav>
  );

  const UploadView = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="text-center mb-10 max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
          Proofreader Otomatis<br />
          <span className="text-emerald-500">Powered by Gemini 2.5</span>
        </h1>
        <p className="text-slate-400 text-lg">
          Upload naskah PDF asli kamu. Sistem akan mengekstrak teks dan mendeteksi kesalahan secara real-time.
        </p>
      </div>

      <div
        className="w-full max-w-xl h-64 border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl bg-slate-900/50 hover:bg-slate-900 transition-all cursor-pointer flex flex-col items-center justify-center group relative overflow-hidden"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFileUpload}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform z-10">
          <UploadCloud className="text-emerald-400" size={32} />
        </div>
        <p className="text-white font-medium text-lg mb-2 z-10">Drag PDF di sini</p>
        <p className="text-slate-500 text-sm mb-6 z-10">Mendukung PDF & TXT</p>
        <label className="z-10 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-full font-medium transition cursor-pointer shadow-lg shadow-emerald-900/20 flex items-center gap-2">
          <Search size={16} />
          Analisa Sekarang
          <input type="file" className="hidden" accept=".pdf,.txt" onChange={handleFileUpload} />
        </label>
      </div>

      {!apiKey && (
        <div className="mt-8 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-3 text-yellow-500 text-sm max-w-md">
          <AlertTriangle size={18} />
          <span>API Key belum diatur. Klik tombol settings atau coba upload untuk mengatur.</span>
        </div>
      )}
    </div>
  );

  const AnalyzingView = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full border-t-4 border-emerald-500 animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Cpu className="text-emerald-400 animate-pulse" size={32} />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-white mb-8">Gemini Sedang Bekerja...</h2>

      <div className="space-y-4 w-full max-w-md">
        <LoadingStep
          icon={FileText}
          text="Membaca & Encode file PDF..."
          status={analysisStep >= 1 ? (analysisStep > 1 ? 'completed' : 'active') : 'waiting'}
        />
        <LoadingStep
          icon={UploadCloud}
          text="Mengirim ke Gemini API..."
          status={analysisStep >= 2 ? (analysisStep > 2 ? 'completed' : 'active') : 'waiting'}
        />
        <LoadingStep
          icon={Wand2}
          text="Menganalisa grammar & struktur..."
          status={analysisStep >= 3 ? (analysisStep > 3 ? 'completed' : 'active') : 'waiting'}
        />
      </div>
    </div>
  );

  const ErrorView = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle className="text-red-500" size={40} />
      </div>
      <h3 className="text-2xl font-bold text-white mb-2">Oops, terjadi kesalahan</h3>
      <p className="text-slate-400 max-w-md mb-8">{errorMessage}</p>
      <div className="flex gap-4">
        <button
          onClick={() => setShowSettings(true)}
          className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition border border-slate-700"
        >
          Cek API Key
        </button>
        <button
          onClick={() => setView('upload')}
          className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition shadow-lg shadow-emerald-900/20"
        >
          Coba Lagi
        </button>
      </div>
    </div>
  );

  const ResultsView = () => {
    const isPdf = file?.type === 'application/pdf';

    return (
      <div className="flex h-[calc(100vh-73px)] overflow-hidden bg-slate-950">
        {/* PANEL KIRI: PDF Viewer (Jika file PDF) */}
        {isPdf && fileUrl && (
          <div className="w-1/2 border-r border-slate-800 bg-slate-900 flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center gap-2 text-slate-400 text-sm font-medium">
              <Eye size={16} /> Tampilan Dokumen Asli
            </div>
            <iframe
              src={fileUrl}
              className="w-full h-full"
              title="Original PDF"
            />
          </div>
        )}

        {/* PANEL TENGAH: Editor Hasil Analisis */}
        <div className={`${isPdf ? 'w-1/2' : 'flex-1'} flex flex-col bg-slate-900 border-r border-slate-800`}>
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
              <Columns size={16} /> Hasil Analisis & Koreksi
            </div>
            <button className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition" title="Copy Text">
              <FileText size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 bg-slate-900/50">
            <div className="max-w-3xl mx-auto bg-white/[0.02] rounded-xl p-8 shadow-sm border border-white/5 relative">
              <h2 className="text-xl font-serif text-slate-200 mb-6 border-b border-white/10 pb-4 truncate">
                {file ? file.name : 'Analyzed Document'}
              </h2>

              <div className="prose prose-invert prose-lg max-w-none font-serif leading-relaxed whitespace-pre-wrap text-slate-300">
                {text.split(/(\s+)/).map((word, idx) => {
                  const cleanWord = word.trim();
                  if (cleanWord.length <= 1) return <span key={idx}>{word}</span>;

                  // Pencocokan kata yang lebih aman
                  const errorMatch = errors.find(e => {
                    const originalWords = e.original.split(/\s+/);
                    return originalWords.some(ow => ow.includes(cleanWord) || cleanWord.includes(ow));
                  });

                  if (errorMatch) {
                    const isHighSeverity = errorMatch.severity === 'high';
                    // Style: Garis bawah merah/kuning bergelombang
                    const underlineClass = isHighSeverity
                      ? 'decoration-red-500/80 decoration-wavy decoration-2'
                      : 'decoration-yellow-500/80 decoration-wavy decoration-2';
                    const bgClass = isHighSeverity
                      ? 'bg-red-500/10 hover:bg-red-500/20'
                      : 'bg-yellow-500/10 hover:bg-yellow-500/20';

                    return (
                      <span
                        key={idx}
                        onClick={() => setSelectedError(errorMatch)}
                        className={`underline ${underlineClass} ${bgClass} cursor-pointer transition rounded-sm px-0.5 py-0.5`}
                        title={errorMatch.explanation}
                      >
                        {word}
                      </span>
                    );
                  }
                  return <span key={idx}>{word}</span>;
                })}
              </div>
            </div>
          </div>
        </div>

        {/* PANEL KANAN: Sidebar Daftar Kesalahan */}
        <div className="w-80 bg-slate-950 border-l border-slate-800 flex flex-col shadow-xl z-10">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                <Sparkles className="text-emerald-500" size={16} />
                {errors.length} Isu Ditemukan
              </h3>
              <button
                onClick={() => setView('upload')}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
              >
                <RefreshCw size={12} /> Reset
              </button>
            </div>

            <div className="flex bg-slate-900 p-1 rounded-md">
              {['all', 'grammar', 'spelling'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-1 text-xs font-medium rounded capitalize transition ${activeTab === tab ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-950">
            {errors.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <CheckCircle2 size={40} className="text-green-500 mb-3 opacity-50" />
                <p className="text-sm">Dokumen terlihat sempurna!</p>
              </div>
            ) : (
              getFilteredErrors().map((err) => (
                <div
                  key={err.id}
                  className={`p-3 rounded-lg border transition-all cursor-pointer group text-sm ${selectedError?.id === err.id
                    ? 'bg-emerald-900/20 border-emerald-500/50 shadow-md'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                    }`}
                  onClick={() => setSelectedError(err)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex gap-2 flex-wrap">
                      <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-sm ${err.type === 'grammar' ? 'bg-purple-500/20 text-purple-300' :
                        err.type === 'spelling' ? 'bg-blue-500/20 text-blue-300' :
                          'bg-orange-500/20 text-orange-300'
                        }`}>
                        {err.type}
                      </span>

                      {/* PAGE NUMBER BADGE */}
                      {err.page && (
                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-sm bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
                          <Hash size={8} /> HAL. {err.page}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                    <span className="text-red-400 line-through decoration-red-500/50">{err.original}</span>
                    <ChevronRight size={12} className="text-slate-600" />
                    <span className="text-emerald-400 font-bold">{err.suggestion}</span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed mb-2 line-clamp-2">
                    {err.explanation}
                  </p>

                  {selectedError?.id === err.id && (
                    <button
                      onClick={(e) => { e.stopPropagation(); applyFix(err.id); }}
                      className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-medium flex items-center justify-center gap-1 transition shadow-sm"
                    >
                      <Wand2 size={12} />
                      Perbaiki
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30">
      <Header />
      <main>
        {view === 'upload' && <UploadView />}
        {view === 'analyzing' && <AnalyzingView />}
        {view === 'results' && <ResultsView />}
        {view === 'error' && <ErrorView />}
      </main>
      {showSettings && <ApiKeyModal />}
    </div>
  );
}