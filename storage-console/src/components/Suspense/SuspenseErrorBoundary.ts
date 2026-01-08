import type { ReactNode } from "react";
import { Component } from "react";

interface SuspenseErrorBoundaryProps {
  children: ReactNode;
  fallbackRender: (args: { error: Error | null; retry: () => void }) => ReactNode;
  onReset?: () => void;
}

interface SuspenseErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class SuspenseErrorBoundary extends Component<SuspenseErrorBoundaryProps, SuspenseErrorBoundaryState> {
  state: SuspenseErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): SuspenseErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    if (import.meta.env.DEV) {
      console.error("SuspenseErrorBoundary captured error:", error);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null }, () => {
      this.props.onReset?.();
    });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallbackRender({ error: this.state.error, retry: this.handleReset });
    }

    return this.props.children;
  }
}

export default SuspenseErrorBoundary;