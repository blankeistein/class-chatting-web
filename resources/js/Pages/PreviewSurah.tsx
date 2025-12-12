import React, { useState, useEffect } from 'react';
import { FileCode, UploadCloud, Terminal, Eye, Loader2, FileType, Type, Minus, Plus, AlignLeft, AlignCenter, AlignRight, AlignJustify, FileText } from 'lucide-react';
import JSZip from 'jszip';
import '../../css/preview.css';

export default function PreviewSurah() {
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [xmlSnippet, setXmlSnippet] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>("");

  // 🆕 State untuk Custom Font & Raw XML (untuk re-render real-time)
  const [rawXml, setRawXml] = useState<string | null>(null);
  const [customFontName, setCustomFontName] = useState<string | null>(null);
  const [customFontFileName, setCustomFontFileName] = useState<string>("");
  const [fontTarget, setFontTarget] = useState('all'); // 'all' | 'arabic' | 'latin'
  const [fontSizeScale, setFontSizeScale] = useState<number>(1); // 1.0 = 100%
  const [lineHeightScale, setLineHeightScale] = useState<number>(1.5); // 1.5 default
  const [textAlignMode, setTextAlignMode] = useState<string>('original'); // 'original' | 'left' | 'center' | 'right' | 'justify'

  // 🔄 Efek untuk Re-Parse saat setting font berubah
  useEffect(() => {
    if (rawXml) {
      const html = parseWordXML(rawXml);
      setHtmlContent(html);
    }
  }, [rawXml, customFontName, fontTarget, fontSizeScale, lineHeightScale, textAlignMode]);

  // 🆕 Handle Upload Font Lokal (.ttf, .otf, .woff)
  const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const fontName = `CustomFont_${Date.now()}`; // Nama unik internal
      const fontFace = new FontFace(fontName, buffer);

      await fontFace.load();
      document.fonts.add(fontFace);

      setCustomFontName(fontName);
      setCustomFontFileName(file.name);
    } catch (err) {
      console.error(err);
      alert("Gagal memuat font. Pastikan format file valid (.ttf, .otf, .woff).");
    }
  };

  // 🧠 CORE LOGIC: Parsing XML Word ke HTML
  const parseWordXML = (xmlString: string) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");

    const paragraphs = xmlDoc.getElementsByTagName("w:p");
    let generatedHTML = "";
    let debugXML = "";

    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i];
      let pContent = "";

      const pPr = p.getElementsByTagName("w:pPr")[0];
      let textAlign = "left";
      if (pPr) {
        const jc = pPr.getElementsByTagName("w:jc")[0];
        if (jc) textAlign = jc.getAttribute("w:val") || "left";
      }

      // 🆕 Override Text Align
      if (textAlignMode !== 'original') {
        textAlign = textAlignMode;
      }

      const runs = p.getElementsByTagName("w:r");

      for (let j = 0; j < runs.length; j++) {
        const r = runs[j];
        const textNode = r.getElementsByTagName("w:t")[0];

        if (textNode) {
          const text = textNode.textContent;
          const rPr = r.getElementsByTagName("w:rPr")[0];
          let style = "";

          // 🕌 DETEKSI ARABIC
          const isArabic = /[\u0600-\u06FF]/.test(text);
          if (isArabic) style += "direction: rtl; "; // Selalu RTL untuk Arab

          // --- LOGIKA FONT (Priority: Custom > Amiri > Word XML) ---
          let fontFamily = "";

          // 1. Cek Custom Font User
          if (customFontName) {
            if (fontTarget === 'all') {
              fontFamily = `'${customFontName}'`;
            } else if (fontTarget === 'arabic' && isArabic) {
              fontFamily = `'${customFontName}'`;
            } else if (fontTarget === 'latin' && !isArabic) {
              fontFamily = `'${customFontName}'`;
            }
          }

          // 2. Jika Custom Font tidak terpilih untuk bagian ini
          if (!fontFamily) {
            if (isArabic) {
              fontFamily = "'LPMQ IsepMisbah', serif";
            } else if (rPr) {
              const fontNode = rPr.getElementsByTagName("w:rFonts")[0];
              if (fontNode) {
                const originalFont = fontNode.getAttribute("w:ascii") || fontNode.getAttribute("w:hAnsi");
                if (originalFont) fontFamily = `'${originalFont}', sans-serif`;
              }
            }
          }

          if (fontFamily) style += `font-family: ${fontFamily}; `;
          // -----------------------------------------------------------

          if (rPr) {
            // Warna
            const colorNode = rPr.getElementsByTagName("w:color")[0];
            if (colorNode) {
              const hex = colorNode.getAttribute("w:val");
              if (hex && hex !== "auto") style += `color: #${hex}; `;
            }

            // Ukuran Font
            const szNode = rPr.getElementsByTagName("w:sz")[0];
            if (szNode) {
              const size = parseInt(szNode.getAttribute("w:val") || "12");
              style += `font-size: ${(size / 2) * fontSizeScale}pt; `;
            }

            // Bold / Italic
            if (rPr.getElementsByTagName("w:b").length > 0) style += "font-weight: bold; ";
            if (rPr.getElementsByTagName("w:i").length > 0) style += "font-style: italic; ";
          }

          if (!debugXML && rPr && style.length > 5) {
            debugXML = new XMLSerializer().serializeToString(r);
          }

          pContent += `<span style="${style}">${text}</span>`;
        }
      }

      if (pContent) {
        generatedHTML += `<p style="text-align: ${textAlign}; margin-bottom: 8px; line-height: ${lineHeightScale};">${pContent}</p>`;
      }
    }

    setXmlSnippet(debugXML ? formatXml(debugXML) : "No styled runs found in sample.");
    return generatedHTML;
  };

  const formatXml = (xml: string) => {
    let formatted = '';
    let indent = '';
    const tab = '  ';
    xml.split(/>\s*</).forEach(function (node) {
      if (node.match(/^\/\w/)) indent = indent.substring(tab.length);
      formatted += indent + '<' + node + '>\r\n';
      if (node.match(/^<?\w[^>]*[^\/]$/)) indent += tab;
    });
    return formatted.substring(1, formatted.length - 3);
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsLoading(true);
    setHtmlContent(null);
    setXmlSnippet("");
    setRawXml(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);

      const fileExists = zip.file("word/document.xml");
      if (!fileExists) {
        throw new Error("File document.xml tidak ditemukan.");
      }

      const docXml = await fileExists.async("string");
      setRawXml(docXml); // Simpan raw XML untuk re-parsing nanti

      // Initial parse
      const html = parseWordXML(docXml);
      setHtmlContent(html);
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        alert("Gagal memparsing file. " + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] p-8 text-gray-800 font-sans">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* LEFT COLUMN: Controls & Info */}
        <div className="space-y-6">

          {/* Main Upload Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h1 className="text-2xl font-bold flex items-center gap-2 mb-2 text-indigo-600">
              <FileCode className="w-6 h-6" />
              Docx XML Parser
            </h1>
            <p className="text-gray-500 text-sm mb-6">
              Convert .docx ke HTML. Auto-detect font <span className="font-bold text-green-600 font-serif">Arab (Amiri)</span> & native styling.
            </p>

            <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors relative group border-indigo-200 hover:bg-indigo-50 cursor-pointer`}>
              <input
                type="file"
                accept=".docx"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center gap-3">
                <div className={`p-3 rounded-full transition-transform bg-indigo-100 text-indigo-600 group-hover:scale-110`}>
                  {isLoading ? (
                    <Loader2 className="w-7 h-7 animate-spin" />
                  ) : (
                    <UploadCloud className="w-7 h-7" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-700">
                    {fileName || "Drag & drop atau klik"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Hanya file .docx
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 🆕 Local Font & Size Customizer Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-gray-700">
              <Type className="w-5 h-5 text-purple-600" />
              Kustomisasi Tampilan
            </h3>

            <div className="flex flex-col gap-6">
              {/* Font Size Control */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gray-700">Ukuran Font</label>
                  <span className="text-xs font-mono bg-purple-100 text-purple-700 px-2 py-1 rounded">
                    {Math.round(fontSizeScale * 100)}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setFontSizeScale(Math.max(0.05, fontSizeScale - 0.05))}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="range"
                    min="0.05"
                    max="2.0"
                    step="0.05"
                    value={fontSizeScale}
                    onChange={(e) => setFontSizeScale(parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <button
                    onClick={() => setFontSizeScale(Math.min(2.0, fontSizeScale + 0.05))}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>


              {/* Line Height Control */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gray-700">Jarak Baris</label>
                  <span className="text-xs font-mono bg-purple-100 text-purple-700 px-2 py-1 rounded">
                    {lineHeightScale.toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setLineHeightScale(Math.max(1.0, lineHeightScale - 0.1))}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="range"
                    min="1.0"
                    max="3.0"
                    step="0.1"
                    value={lineHeightScale}
                    onChange={(e) => setLineHeightScale(parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <button
                    onClick={() => setLineHeightScale(Math.min(3.0, lineHeightScale + 0.1))}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Text Alignment Control */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Perataan Teks</label>
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                {[
                  { mode: 'original', icon: FileText, label: 'Asli' },
                  { mode: 'left', icon: AlignLeft, label: 'Kiri' },
                  { mode: 'center', icon: AlignCenter, label: 'Tengah' },
                  { mode: 'right', icon: AlignRight, label: 'Kanan' },
                  { mode: 'justify', icon: AlignJustify, label: 'Rata' },
                ].map((item) => (
                  <button
                    key={item.mode}
                    onClick={() => setTextAlignMode(item.mode)}
                    title={item.label}
                    className={`flex-1 p-2 rounded-md transition-all flex justify-center items-center ${textAlignMode === item.mode
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    <item.icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100"></div>

            {/* Font Uploader */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Font Kustom</label>
              <div className="relative">
                <input
                  type="file"
                  accept=".ttf,.otf,.woff,.woff2"
                  onChange={handleFontUpload}
                  className="hidden"
                  id="font-upload"
                />
                <label
                  htmlFor="font-upload"
                  className="flex items-center justify-between w-full px-4 py-3 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors"
                >
                  <span className="text-sm font-medium truncate">
                    {customFontFileName || "Upload Font (.ttf, .otf)"}
                  </span>
                  <UploadCloud className="w-4 h-4 ml-2" />
                </label>
              </div>
            </div>

            {/* Target Selector (Only show if font loaded) */}
            {customFontName && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <p className="text-xs font-semibold text-gray-500 uppercase">Terapkan Font Pada:</p>
                <div className="grid grid-cols-3 gap-2">
                  {['all', 'arabic', 'latin'].map((target) => (
                    <button
                      key={target}
                      onClick={() => setFontTarget(target)}
                      className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${fontTarget === target
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                      {target === 'all' ? 'Semua' : target === 'arabic' ? 'Teks Arab' : 'Teks Latin'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>


          {/* Dev Stats / XML Inspector */}
          {xmlSnippet && (
            <div className="bg-gray-900 text-gray-300 p-6 rounded-2xl shadow-lg overflow-hidden border border-gray-700">
              <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-2">
                <h3 className="text-sm font-mono flex items-center gap-2 text-green-400">
                  <Terminal className="w-4 h-4" />
                  XML Node Sample
                </h3>
                <span className="text-xs bg-gray-800 px-2 py-1 rounded">Raw XML</span>
              </div>
              <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                {xmlSnippet}
              </pre>
            </div>
          )}
        </div>


        {/* RIGHT COLUMN: Preview */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col h-[80vh] lg:h-auto">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 rounded-t-2xl">
            <span className="font-semibold text-gray-600 flex items-center gap-2">
              <Eye className="w-[18px] h-[18px]" />
              Live Preview
            </span>
            <span className="text-xs text-gray-400 uppercase tracking-wider font-mono">Rendered HTML</span>
          </div>

          <div className="flex-1 p-8 overflow-y-auto bg-white rounded-b-2xl">
            {htmlContent ? (
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-300">
                <FileType className="w-12 h-12 mb-4 opacity-50" />
                <p>Hasil konversi akan muncul di sini</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}