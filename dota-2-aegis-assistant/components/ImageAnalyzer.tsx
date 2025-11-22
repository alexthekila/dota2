import React, { useState, useRef } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { analyzeScreenshot } from '../services/geminiService';

const ImageAnalyzer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setLoading(true);
    setResult(null);
    
    try {
      // Extract base64 data (remove "data:image/jpeg;base64," prefix)
      const base64Data = image.split(',')[1];
      const mimeType = image.split(';')[0].split(':')[1];
      
      const text = await analyzeScreenshot(base64Data, mimeType);
      setResult(text || "Could not analyze image.");
    } catch (error) {
      setResult("Error analyzing image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-50 bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-full flex items-center gap-2 text-sm border border-gray-600 shadow-lg transition-all"
      >
        <Camera size={16} /> Analyze Screenshot
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-dota-panel border border-dota-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-4 bg-gray-800 border-b border-dota-border flex justify-between items-center">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Camera size={20} /> Screenshot Analysis
          </h3>
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {!image ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-600 rounded-lg p-10 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-900/10 transition-colors h-64"
            >
              <Upload className="w-12 h-12 text-gray-500 mb-4" />
              <p className="text-gray-300 font-medium">Click to upload draft screenshot</p>
              <p className="text-gray-500 text-sm mt-2">Supports JPG, PNG</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative h-64 rounded-lg overflow-hidden bg-black border border-gray-700">
                 <img src={image} alt="Upload" className="w-full h-full object-contain" />
                 <button 
                   onClick={() => setImage(null)}
                   className="absolute top-2 right-2 bg-black/60 hover:bg-red-600 text-white p-1 rounded-full"
                 >
                   <X size={16} />
                 </button>
              </div>
              
              {!result && !loading && (
                <button 
                  onClick={handleAnalyze}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded transition-colors"
                >
                  Analyze Draft with Gemini Vision
                </button>
              )}

              {loading && (
                <div className="flex items-center justify-center p-8">
                   <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
                   <span className="text-blue-400 animate-pulse">Processing image...</span>
                </div>
              )}

              {result && (
                <div className="bg-gray-800 p-4 rounded border border-gray-700">
                  <h4 className="font-bold text-green-400 mb-2">Analysis Result:</h4>
                  <p className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">{result}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageAnalyzer;
