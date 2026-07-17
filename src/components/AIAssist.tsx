import React, { useState } from 'react';
import { Sparkles, Loader2, Upload, FileText, CheckCircle2 } from 'lucide-react';
import { extractInspectionData } from '../services/geminiService';
import { InspectionData } from '../pages/backoffice/backofficeTypes';
import { motion, AnimatePresence } from 'motion/react';

interface AIAssistProps {
  onDataExtracted: (data: Partial<InspectionData>) => void;
}

const AIAssist: React.FC<AIAssistProps> = ({ onDataExtracted }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputText, setInputText] = useState('');
  const [success, setSuccess] = useState(false);

  const handleProcessText = async () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);
    try {
      const result = await extractInspectionData(inputText);
      if (result) {
        onDataExtracted(result);
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setIsOpen(false);
          setInputText('');
        }, 1500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64 = event.target?.result as string;
        const data = base64.split(',')[1];
        const result = await extractInspectionData({ mimeType: file.type, data });
        if (result) {
          onDataExtracted(result);
          setSuccess(true);
          setTimeout(() => {
            setSuccess(false);
            setIsOpen(false);
          }, 1500);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative">
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all active:scale-95 text-xs cursor-pointer"
      >
        <Sparkles size={14} />
        <span>AI Smart Populate</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute top-12 right-0 w-96 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 z-50 overflow-hidden text-left"
          >
            <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
              <h3 className="font-black text-gray-800 text-xs flex items-center gap-2">
                <Sparkles size={14} className="text-emerald-600" />
                AI Assistant
              </h3>
              <button type="button" onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg font-bold">×</button>
            </div>

            {success ? (
              <div className="py-6 flex flex-col items-center justify-center text-emerald-600">
                <CheckCircle2 size={40} className="mb-2 animate-bounce" />
                <span className="font-bold text-xs">Data extracted successfully!</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-[10px] text-gray-500 font-bold leading-normal">
                  Paste raw notes, property descriptions, or upload a photo of the property label to auto-fill fields.
                </div>
                
                <textarea 
                  className="w-full h-28 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-sans"
                  placeholder="Paste text here... (e.g. Kerkstraat 45, Utrecht. M. Janssen is occupant...)"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />

                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    disabled={isProcessing || !inputText.trim()}
                    onClick={handleProcessText}
                    className="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-700 transition-colors cursor-pointer"
                  >
                    {isProcessing ? <Loader2 className="animate-spin" size={14} /> : <FileText size={14} />}
                    Process Text
                  </button>
                  
                  <label className="cursor-pointer bg-emerald-50 text-emerald-600 p-2 rounded-xl hover:bg-emerald-100 transition-colors border border-emerald-100">
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={isProcessing} />
                    <Upload size={16} />
                  </label>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIAssist;
export { AIAssist };
