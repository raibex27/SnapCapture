
import { useState, useEffect, useCallback } from 'react';
import type { Capture } from '../types';

const HISTORY_KEY = 'snapcapture_history';
const MAX_HISTORY_ITEMS = 10;

export const useHistory = () => {
  const [history, setHistory] = useState<Capture[]>([]);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(HISTORY_KEY);
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Failed to load history from localStorage", error);
    }
  }, []);

  const addCapture = useCallback((capture: Capture) => {
    setHistory(prevHistory => {
      const newHistory = [{ ...capture, timestamp: Date.now() }, ...prevHistory];
      if (newHistory.length > MAX_HISTORY_ITEMS) {
        // Revoke blob URL of the oldest item before removing it
        const oldestItem = newHistory[newHistory.length-1];
        if (oldestItem.image.startsWith('blob:')) {
           URL.revokeObjectURL(oldestItem.image);
        }
        newHistory.pop();
      }
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
      } catch (error) {
        console.error("Failed to save history to localStorage", error);
      }
      return newHistory;
    });
  }, []);

  const clearHistory = useCallback(() => {
    // Revoke all blob URLs before clearing
    history.forEach(item => {
      if(item.image.startsWith('blob:')) {
        URL.revokeObjectURL(item.image)
      }
    });
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch (error) {
      console.error("Failed to clear history from localStorage", error);
    }
  }, [history]);

  return { history, addCapture, clearHistory };
};
