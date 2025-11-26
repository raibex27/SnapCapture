
import React from 'react';
import type { Capture } from '../types';
import { TrashIcon, EyeIcon } from './Icons';

interface HistoryViewProps {
  history: Capture[];
  onSelect: (item: Capture) => void;
  onClear: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ history, onSelect, onClear }) => {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
        <p className="text-lg">Your capture history is empty.</p>
        <p>Scanned images will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Capture History</h2>
        <button
          onClick={onClear}
          className="flex items-center gap-2 px-3 py-1.5 bg-red-600/20 text-red-400 text-sm font-medium rounded-md hover:bg-red-600/40 transition-colors"
        >
          <TrashIcon className="w-4 h-4" />
          Clear All
        </button>
      </div>
      <ul className="space-y-3">
        {history.map((item) => (
          <li key={item.id} className="bg-gray-800 rounded-lg p-3 flex items-center gap-4 shadow-md">
            <img src={item.image} alt="Capture thumbnail" className="w-16 h-16 object-cover rounded-md flex-shrink-0 bg-gray-700" />
            <div className="flex-grow overflow-hidden">
              <p className="text-sm text-gray-300 truncate">{item.text || "No text found."}</p>
              <p className="text-xs text-gray-500">{new Date(item.timestamp || 0).toLocaleString()}</p>
            </div>
            <button onClick={() => onSelect(item)} className="p-2 text-gray-400 hover:text-indigo-400 transition-colors flex-shrink-0">
              <EyeIcon className="w-5 h-5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
