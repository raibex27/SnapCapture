
import React, { useState, useCallback, useMemo } from 'react';
import { useHistory } from './hooks/useHistory';
import { HistoryView } from './components/HistoryView';
import { CameraIcon, ClipboardIcon, ShareIcon, HistoryIcon, XCircleIcon, PhoneIcon, SparklesIcon, LogoIcon, CropIcon, UndoIcon, PDFIcon } from './components/Icons';
import { ImageCropper } from './components/ImageCropper';
import { extractTextFromImage } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import type { Capture } from './types';
import { jsPDF } from "jspdf";

type View = 'capture' | 'history';

const App: React.FC = () => {
  const [view, setView] = useState<View>('capture');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState<boolean>(false);
  const { history, addCapture, clearHistory } = useHistory();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      resetState(true);
      setImageFile(file);
      setOriginalImageFile(file);
      const url = URL.createObjectURL(file);
      setImageUrl(url);
    }
  };

  const handleCropConfirm = (croppedBlob: Blob) => {
    if (imageUrl) URL.revokeObjectURL(imageUrl); // Cleanup old URL
    
    // Convert Blob to File to maintain consistency with app logic
    const newFile = new File([croppedBlob], "cropped-image.png", { type: "image/png" });
    const newUrl = URL.createObjectURL(newFile);
    
    setImageFile(newFile);
    setImageUrl(newUrl);
    setIsCropping(false);
  };

  const handleCropCancel = () => {
    setIsCropping(false);
  };

  const handleRevert = () => {
    if (!originalImageFile) return;
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    const newUrl = URL.createObjectURL(originalImageFile);
    setImageFile(originalImageFile);
    setImageUrl(newUrl);
  };

  const handleAnalyzeClick = useCallback(async () => {
    if (!imageFile || !imageUrl) return;

    setIsLoading(true);
    setError(null);
    setExtractedText(null);

    try {
      const base64Image = await fileToBase64(imageFile);
      const mimeType = imageFile.type;
      const text = await extractTextFromImage(base64Image, mimeType);
      setExtractedText(text);
      addCapture({ id: Date.now().toString(), image: imageUrl, text });
    } catch (err) {
      setError('Failed to analyze image. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [imageFile, imageUrl, addCapture]);

  const resetState = (keepHistory: boolean = false) => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
    setImageFile(null);
    setOriginalImageFile(null);
    setImageUrl(null);
    setExtractedText(null);
    setIsLoading(false);
    setError(null);
    setIsCropping(false);
    // Reset file input value to allow re-selecting the same file
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if(fileInput) fileInput.value = '';
  };
  
  const handleHistoryItemSelect = (item: Capture) => {
    resetState();
    setImageUrl(item.image);
    setExtractedText(item.text);
    setImageFile(null); // Can't recreate file, so disable re-analysis unless implemented differently
    setView('capture');
  }

  const renderContent = () => {
    if (view === 'history') {
      return <HistoryView history={history} onSelect={handleHistoryItemSelect} onClear={clearHistory} />;
    }

    if (isLoading) {
      return <LoadingSpinner />;
    }

    if (error) {
      return <ErrorDisplay message={error} onRetry={handleAnalyzeClick} />;
    }

    if (extractedText !== null && imageUrl) {
      return <ResultDisplay text={extractedText} imageUrl={imageUrl} onReset={resetState} onTextChange={setExtractedText} />;
    }

    if (imageUrl) {
      if (isCropping) {
        return <ImageCropper imageSrc={imageUrl} onConfirm={handleCropConfirm} onCancel={handleCropCancel} />;
      }
      return (
        <ImagePreview 
            imageUrl={imageUrl} 
            onAnalyze={handleAnalyzeClick} 
            onReset={resetState} 
            onCrop={() => setIsCropping(true)}
            onRevert={imageFile !== originalImageFile && originalImageFile ? handleRevert : undefined}
        />
      );
    }

    return <CapturePrompt onFileChange={handleFileChange} />;
  };

  return (
    <div className="flex flex-col h-[100dvh] font-sans">
      <Header />
      <main className="flex-grow overflow-y-auto p-4 md:p-6 bg-transparent">
        <div className="max-w-3xl mx-auto h-full">
          {renderContent()}
        </div>
      </main>
      <BottomNav activeView={view} setView={setView} />
    </div>
  );
};

const Header: React.FC = () => (
  <header className="bg-gray-800/50 backdrop-blur-sm p-4 text-center shadow-md sticky top-0 z-10">
    <h1 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
      <LogoIcon className="w-8 h-8" />
      SnapCapture
    </h1>
  </header>
);

const CapturePrompt: React.FC<{ onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void }> = ({ onFileChange }) => (
  <div className="flex flex-col items-center justify-center h-full text-center p-4">
    {/* Main container with futuristic styling */}
    <div className="relative w-full max-w-md p-8 overflow-hidden bg-gray-900/50 backdrop-blur-sm border border-indigo-500/20 rounded-2xl shadow-xl shadow-indigo-900/20">
      
      {/* Animated Scan Line */}
      <div className="absolute left-0 right-0 h-1 bg-indigo-400 animate-scan-line" style={{
        boxShadow: '0px 0px 15px 1px rgba(99, 102, 241, 0.7)',
        filter: 'blur(1px)'
      }}></div>

      {/* Corner Brackets */}
      <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-indigo-400/60 rounded-tl-lg"></div>
      <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-indigo-400/60 rounded-tr-lg"></div>
      <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-indigo-400/60 rounded-bl-lg"></div>
      <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-indigo-400/60 rounded-br-lg"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="inline-block p-4 bg-gray-800/70 border border-gray-700 rounded-full">
          <CameraIcon className="w-16 h-16 text-indigo-400" />
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-white">AI Text Scanner</h1>
        <h2 className="text-lg font-medium text-indigo-400 mt-1">Image to Text Converter</h2>
        <p className="mt-3 text-gray-400 max-w-xs text-sm">
          Instantly extract text, code, and numbers from photos using Google Gemini AI. Free, fast, and secure OCR.
        </p>
        <label htmlFor="file-input" className="cursor-pointer mt-8 inline-flex items-center justify-center gap-3 px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900 transition-all transform hover:scale-105 hover:shadow-xl hover:shadow-indigo-600/50">
          <CameraIcon className="w-6 h-6" />
          Scan Image Now
        </label>
        <input id="file-input" type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />
      </div>
    </div>
  </div>
);


const ImagePreview: React.FC<{ imageUrl: string; onAnalyze: () => void; onReset: () => void; onCrop: () => void; onRevert?: () => void }> = ({ imageUrl, onAnalyze, onReset, onCrop, onRevert }) => (
  <div className="flex flex-col items-center justify-center h-full gap-4">
    <div className="relative group">
        <img src={imageUrl} alt="Captured preview" className="max-h-[60vh] w-auto object-contain rounded-lg shadow-lg border border-gray-700" />
        {/* Helper text overlay */}
        <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none opacity-60">
            <span className="bg-black/50 text-xs px-2 py-1 rounded-full text-white">Review your image</span>
        </div>
    </div>
    <div className="flex flex-wrap justify-center gap-3 mt-4 w-full max-w-md">
      <button onClick={onReset} className="flex-1 min-w-[100px] flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors">
        <XCircleIcon className="w-5 h-5" />
        Cancel
      </button>
      {onRevert && (
          <button onClick={onRevert} className="flex-1 min-w-[100px] flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors">
            <UndoIcon className="w-5 h-5" />
            Undo
          </button>
      )}
      <button onClick={onCrop} className="flex-1 min-w-[100px] flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/30">
        <CropIcon className="w-5 h-5" />
        Crop
      </button>
      <button onClick={onAnalyze} className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-900/30">
        <SparklesIcon className="w-5 h-5" />
        Analyze
      </button>
    </div>
  </div>
);

const ResultDisplay: React.FC<{ text: string; imageUrl: string; onReset: () => void; onTextChange: (newText: string) => void; }> = ({ text, imageUrl, onReset, onTextChange }) => {
  const phoneNumbers = useMemo(() => {
    // A more permissive regex to find potential phone numbers, including international formats.
    const regex = /[+\d(][\d\s().-]{6,}/g;
    const potentialMatches = text.match(regex) || [];

    // Filter matches
    return potentialMatches
      .map(match => match.trim().replace(/[.,\s-]$/, ''))
      .filter(match => {
        const digitCount = (match.match(/\d/g) || []).length;
        return digitCount >= 7 && digitCount <= 15;
      });
  }, [text]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
  };

  const shareText = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Text from SnapCapture',
        text: text,
      });
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const maxContentWidth = pageWidth - (margin * 2);

    // Title
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text("SnapCapture Result", margin, 20);

    // Timestamp
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, 26);

    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, 30, pageWidth - margin, 30);

    let currentY = 40;

    // Add Image
    const img = new Image();
    img.src = imageUrl;
    
    // We can't access image dimensions synchronously if it's not loaded, but since it's a blob url displayed in app, it's likely hot.
    // However, to be safe, we calculate aspect ratio.
    const imgAspect = img.width / img.height;
    // Limit image height to 40% of page to leave room for text
    const maxImgHeight = pageHeight * 0.4;
    let renderImgWidth = maxContentWidth;
    let renderImgHeight = renderImgWidth / imgAspect;

    if (renderImgHeight > maxImgHeight) {
      renderImgHeight = maxImgHeight;
      renderImgWidth = renderImgHeight * imgAspect;
    }

    // Centering the image
    const xPos = margin + (maxContentWidth - renderImgWidth) / 2;

    try {
      doc.addImage(img, 'PNG', xPos, currentY, renderImgWidth, renderImgHeight);
      currentY += renderImgHeight + 15;
    } catch (e) {
      console.error("Error adding image to PDF", e);
      // Fallback if adding image fails
      doc.text("[Image could not be loaded]", margin, currentY);
      currentY += 10;
    }

    // Add Extracted Text
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Extracted Text:", margin, currentY);
    currentY += 8;

    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    
    const splitText = doc.splitTextToSize(text, maxContentWidth);
    
    // Simple pagination check
    const lineHeight = 5;
    if (currentY + splitText.length * lineHeight > pageHeight - margin) {
       // If text doesn't fit, let jsPDF handle wrapping or simple dump
       // For a robust app we'd loop and add pages, but for this snippet:
       doc.text(splitText, margin, currentY);
    } else {
       doc.text(splitText, margin, currentY);
    }
    
    doc.save(`SnapCapture-${Date.now()}.pdf`);
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-2 text-indigo-400">Extracted Text (Editable)</h3>
        <textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          className="w-full text-gray-200 font-sans bg-gray-900 p-3 rounded-md resize-y h-48 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
          aria-label="Editable extracted text"
        />
        <div className="flex gap-2 mt-4 flex-wrap">
          <button onClick={copyToClipboard} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors text-sm min-w-[100px]">
            <ClipboardIcon className="w-4 h-4" /> Copy
          </button>
          <button onClick={handleExportPDF} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors text-sm min-w-[100px]">
            <PDFIcon className="w-4 h-4" /> PDF
          </button>
          {navigator.share && (
            <button onClick={shareText} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors text-sm min-w-[100px]">
              <ShareIcon className="w-4 h-4" /> Share
            </button>
          )}
        </div>
      </div>

      {phoneNumbers.length > 0 && (
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-2 text-green-400">Detected Phone Numbers</h3>
          <div className="flex flex-col gap-2">
            {phoneNumbers.map((num, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-gray-700 rounded-md">
                <div className="flex items-center gap-2 overflow-hidden">
                  <PhoneIcon className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="font-mono truncate">{num}</span>
                </div>
                <a 
                  href={`tel:${num.replace(/\s/g, '')}`}
                  className="flex-shrink-0 flex items-center gap-1.5 ml-4 px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-md hover:bg-green-700 transition-colors"
                >
                  <PhoneIcon className="w-3 h-3" />
                  Call
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="text-center pt-4">
         <button onClick={() => onReset()} className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-transform transform hover:scale-105">
            Scan Another
         </button>
      </div>
    </div>
  );
};

const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full text-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400"></div>
    <p className="mt-4 text-lg">Analyzing image...</p>
    <p className="text-gray-400 text-sm">This may take a moment.</p>
  </div>
);

const ErrorDisplay: React.FC<{ message: string; onRetry: () => void; }> = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center h-full text-center bg-red-900/20 p-6 rounded-lg">
    <XCircleIcon className="w-12 h-12 text-red-400 mb-4" />
    <h3 className="text-xl font-semibold text-red-400">An Error Occurred</h3>
    <p className="text-gray-300 mb-6">{message}</p>
    <button onClick={onRetry} className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
      Try Again
    </button>
  </div>
);

const BottomNav: React.FC<{ activeView: View; setView: (view: View) => void }> = ({ activeView, setView }) => {
  // Fix: Specify props for the icon element to ensure correct typing with React.cloneElement.
  const NavButton = ({ view, label, icon }: { view: View; label: string; icon: React.ReactElement<{ className?: string }> }) => {
    const isActive = activeView === view;
    
    // Clone the icon to add the glowing effect class conditionally
    const iconWithGlow = React.cloneElement(icon, {
      className: `${icon.props.className || ''} transition-all duration-300 ${isActive ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.9)]' : 'drop-shadow-none'}`
    });

    return (
      <button
        onClick={() => setView(view)}
        className={`flex-1 flex flex-col items-center justify-center p-2 transition-colors duration-200 ${isActive ? 'text-blue-400' : 'text-gray-400 hover:text-white'}`}
      >
        {iconWithGlow}
        <span className="text-xs font-medium mt-1">{label}</span>
      </button>
    );
  };

  return (
    <nav className="bg-gray-800/80 backdrop-blur-sm shadow-t-lg sticky bottom-0 z-10 flex border-t border-gray-700">
      <NavButton view="capture" label="Capture" icon={<CameraIcon className="w-6 h-6" />} />
      <NavButton view="history" label="History" icon={<HistoryIcon className="w-6 h-6" />} />
    </nav>
  );
};

export default App;
