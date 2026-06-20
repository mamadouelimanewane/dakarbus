import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6"
          style={{ background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)' }}>
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-8 rounded-3xl max-w-md w-full shadow-2xl animate-fade-up text-center">
            <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 border border-red-500/30 shadow-inner">
              ⚠️
            </div>
            <h1 className="text-xl font-bold text-white mb-2 tracking-wide">Une erreur est survenue</h1>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              Désolé, l'application a rencontré un problème inattendu.
            </p>
            <div className="p-4 bg-black/40 rounded-xl text-left overflow-auto mb-8 border border-white/5">
              <code className="text-xs text-red-300 font-mono break-all">
                {this.state.error?.message || 'Erreur inconnue'}
              </code>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold rounded-2xl hover:from-blue-500 hover:to-blue-400 transition-all active:scale-95 shadow-[0_8px_20px_rgba(37,99,235,0.4)]"
            >
              Recharger l'application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
