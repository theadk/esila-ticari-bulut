import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl w-full text-center">
            <h1 className="text-3xl font-bold text-red-600 mb-4">Bir Hata Oluştu</h1>
            <p className="text-gray-600 mb-6">Uygulama yüklenirken veya çalışırken beklenmeyen bir hata ile karşılaşıldı.</p>
            
            {this.state.error && (
              <div className="bg-red-50 text-red-800 p-4 rounded-lg text-left overflow-auto mb-6 max-h-60 text-sm font-mono whitespace-pre-wrap">
                {this.state.error.toString()}
              </div>
            )}
            
            {this.state.errorInfo && (
               <div className="bg-gray-100 text-gray-800 p-4 rounded-lg text-left overflow-auto mb-6 max-h-60 text-xs font-mono whitespace-pre-wrap">
                 {this.state.errorInfo.componentStack}
               </div>
            )}

            <button 
              onClick={() => window.location.reload()} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
