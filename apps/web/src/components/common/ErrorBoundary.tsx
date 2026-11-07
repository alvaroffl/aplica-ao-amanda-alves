import * as React from 'react';
import i18n from '@/i18n';

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error(error);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          role="alert"
          className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 p-6 text-center"
        >
          <h1 className="text-xl font-semibold">{i18n.t('common.errorTitle')}</h1>
          <p className="text-muted-foreground">{i18n.t('common.errorText')}</p>
          <button
            type="button"
            className="rounded-lg bg-primary px-4 py-2 text-primary-foreground"
            onClick={() => window.location.reload()}
          >
            {i18n.t('common.reload')}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
