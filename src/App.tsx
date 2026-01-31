import React from 'react';
import { AppRouter } from './components/AppRouter';
import { SimpleErrorBoundary } from './components/error/SimpleErrorBoundary';
import { ToastContainer } from './components/ui/Toast';
import { useToastStore } from './store/toastStore';
import { AppProvider } from './store/simpleStore';

function App() {
  const { toasts, removeToast } = useToastStore();

  return (
    <AppProvider>
      <div className="dark">
        <SimpleErrorBoundary 
          componentName="App" 
          enableRecovery={true}
          onError={(error, errorInfo) => {
            console.error('Critical app error:', error, errorInfo);
            // In case of critical error, try to preserve user session
            const token = localStorage.getItem('auth_token');
            if (token) {
              console.log('Preserving user session during app recovery');
            }
          }}
        >
          <AppRouter />
          
          {/* Global toast notifications */}
          <ToastContainer toasts={toasts} onDismiss={removeToast} />
        </SimpleErrorBoundary>
      </div>
    </AppProvider>
  );
}

export default App;