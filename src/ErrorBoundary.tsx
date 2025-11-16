import React from 'react';

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error?: Error };

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: any) {
    console.error('App error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return <div className="p-4 text-red-700">Se produjo un error. Revisa la consola.</div>;
    }
    return this.props.children;
  }
}
