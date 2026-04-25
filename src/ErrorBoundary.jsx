import { Component } from "react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Log for debugging; avoid noisy prod telemetry since the app is client-only.
    if (import.meta.env.DEV) {
      console.error("Vectorio crashed:", error, info);
    }
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div style={{
        padding: "64px 24px",
        maxWidth: 560,
        margin: "0 auto",
        fontFamily: "var(--sans, system-ui, sans-serif)",
        color: "var(--fg, #111)",
      }}>
        <div style={{
          fontFamily: "var(--mono, monospace)",
          fontSize: 11,
          letterSpacing: "0.08em",
          color: "var(--fg-faint, #888)",
          textTransform: "uppercase",
          marginBottom: 16,
        }}>
          unexpected error
        </div>
        <h1 style={{
          fontFamily: "var(--serif, Georgia, serif)",
          fontSize: 40,
          lineHeight: 1.1,
          margin: "0 0 16px",
          fontWeight: 500,
        }}>
          Something broke.
        </h1>
        <p style={{ color: "var(--fg-muted, #555)", lineHeight: 1.55, marginBottom: 24 }}>
          Vectorio ran into an error it couldn't recover from. Your SVG data is local — nothing was lost on a server, because there is no server. Reload to try again, or clear local state if it keeps happening.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "10px 16px",
              border: "none",
              borderRadius: 8,
              background: "var(--accent, #6b7a3a)",
              color: "#fff",
              fontFamily: "inherit",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
          <button
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            style={{
              padding: "10px 16px",
              border: "1px solid var(--rule, #ddd)",
              borderRadius: 8,
              background: "transparent",
              color: "inherit",
              fontFamily: "inherit",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Clear local state & reload
          </button>
        </div>
        {import.meta.env.DEV && (
          <pre style={{
            marginTop: 32,
            padding: 16,
            background: "rgba(0,0,0,0.04)",
            borderRadius: 8,
            fontSize: 11,
            overflow: "auto",
          }}>
            {String(this.state.error?.stack || this.state.error)}
          </pre>
        )}
      </div>
    );
  }
}
