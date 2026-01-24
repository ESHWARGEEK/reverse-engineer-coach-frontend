import React, { useEffect, useState } from 'react';
import { AppRouter } from './components/AppRouter';
import { ErrorBoundary } from './components/error/ErrorBoundary';
import { ToastContainer } from './components/ui/Toast';
import { AppProvider } from './store/simpleStore';
// Temporarily comment out the problematic store hook
// import { useToastStore } from './store/toastStore';
import { initializeErrorHandler } from './utils/errorHandler';

function App() {
  // Temporary simple state instead of store hook
  const [toasts, setToasts] = useState<any[]>([]);
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Initialize error handler with toast integration
  useEffect(() => {
    initializeErrorHandler();
  }, []);

  return (
    <AppProvider>
      <div className="dark">
        <ErrorBoundary componentName="App" enableRecovery={true}>
          <AppRouter />
          
          {/* Global toast notifications */}
          <ToastContainer toasts={toasts} onDismiss={removeToast} />
        </ErrorBoundary>
      </div>
    </AppProvider>
  );
}

export default App;