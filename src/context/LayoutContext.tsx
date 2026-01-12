import { createContext, useContext, useRef, type RefObject } from 'react';

interface LayoutContextType {
  volumeViewportRef: RefObject<HTMLDivElement | null>;
}

const LayoutContext = createContext<LayoutContextType | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useLayoutContext() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayoutContext must be used within a LayoutContextProvider');
  }
  return context;
}

export function LayoutContextProvider({ children }: { children: React.ReactNode }) {
  const volumeViewportRef = useRef<HTMLDivElement>(null);

  return (
    <LayoutContext.Provider value={{ volumeViewportRef }}>
      {children}
    </LayoutContext.Provider>
  );
}
