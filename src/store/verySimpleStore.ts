import React, { createContext, useContext, ReactNode } from 'react';

// Very simple store without any hooks or complex state management
interface SimpleAppContextType {
  // Just basic data, no complex state management
  isInitialized: boolean;
}

const SimpleAppContext = createContext<SimpleAppContextType>({
  isInitialized: true
});

interface SimpleAppProviderProps {
  children: ReactNode;
}

export const SimpleAppProvider: React.FC<SimpleAppProviderProps> = ({ children }) => {
  const contextValue: SimpleAppContextType = {
    isInitialized: true
  };
  
  return React.createElement(
    SimpleAppContext.Provider,
    { value: contextValue },
    children
  );
};

export const useSimpleApp = () => {
  const context = useContext(SimpleAppContext);
  return context;
};