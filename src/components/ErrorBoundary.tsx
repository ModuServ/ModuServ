import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return this.props.fallback ?? (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "64px 24px",
          gap: "12px",
          textAlign: "center",
        }}>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" }}>
            Something went wrong
          </p>
          <p style={{ margin: 0, fontSize: 14, color: "#6b7280", maxWidth: 400 }}>
            {this.state.error.message}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            style={{
              marginTop: 8,
              padding: "8px 20px",
              background: "#111827",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
