import { createContext, useContext, useState, useCallback } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [currentMode, setCurrentMode] = useState('landing'); // landing, scout, build, report
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [activeOverlays, setActiveOverlays] = useState([]);
  const [compareMode, setCompareMode] = useState(false);
  const [visitedModes, setVisitedModes] = useState(['landing']);

  const navigateTo = useCallback((mode) => {
    setCurrentMode(mode);
    setVisitedModes(prev => prev.includes(mode) ? prev : [...prev, mode]);
  }, []);

  const toggleOverlay = useCallback((overlay) => {
    setActiveOverlays(prev => {
      if (prev.includes(overlay)) {
        return prev.filter(o => o !== overlay);
      }
      if (compareMode) {
        if (prev.length >= 2) return [prev[1], overlay];
        return [...prev, overlay];
      }
      return [overlay];
    });
  }, [compareMode]);

  return (
    <AppContext.Provider value={{
      currentMode, navigateTo,
      selectedRegion, setSelectedRegion,
      activeOverlays, toggleOverlay,
      compareMode, setCompareMode,
      visitedModes,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
