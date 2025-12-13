import React from 'react';
import { X, Smartphone } from 'lucide-react';

interface PackageData {
  title: string;
  subtitle?: string;
  content?: any[];
}

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  screenUrl: string | null;
  packageData: PackageData | null;
}

export default function PreviewModal({ isOpen, onClose, screenUrl, packageData }: PreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="relative scale-75 md:scale-90 transition-transform">
        {/* Close Button Outside */}
        <button
          onClick={onClose}
          className="absolute -right-12 top-0 text-slate-400 hover:text-white transition-colors p-2"
        >
          <X size={24} />
        </button>

        {/* Mobile Device Frame */}
        <div className="w-[360px] h-[720px] bg-slate-950 border-[10px] border-slate-800 rounded-[3rem] shadow-2xl flex flex-col overflow-hidden relative">
          {/* Clickable Notch / Status Bar Area */}
          <div className="absolute top-0 left-0 right-0 h-6 bg-slate-800 z-10 flex justify-center">
            <div className="w-24 h-4 bg-black rounded-b-xl"></div>
          </div>

          {/* Mobile Content Area */}
          <div className="flex-1 bg-white overflow-hidden flex flex-col pt-8 relative group" style={{
            backgroundImage: screenUrl ? `url(${screenUrl})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center'
          }}>
            {
              packageData && (
                <div className="flex-1 flex flex-col text-slate-400 p-8 text-center space-y-4 overflow-auto" >
                  <div className="">
                    <div className="flex flex-col rounded-md overflow-hidden bg-white w-44">
                      <img src={`${screenUrl}`} className="w-full h-64 object-cover" />
                      <p className="font-bold text-md p-2 text-black">{packageData.title}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {
                      packageData.content && packageData.content.map((item: any, index: number) => (
                        <div key={index} className="w-full rounded overflow-hidden p-2 bg-white">
                          <p className='font-bold text-md text-black mb-2'>{item.name}</p>
                          <button className="bg-orange-500 text-white p-2 rounded text-sm w-full">Masuk</button>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
          </div >

          {/* Home Indicator */}
          < div className="h-1 bg-slate-800 flex items-center justify-center pb-2" >
            <div className="w-1/3 h-1 bg-slate-600 rounded-full mt-auto mb-1"></div>
          </div >
        </div >
      </div >
    </div >
  );
}
