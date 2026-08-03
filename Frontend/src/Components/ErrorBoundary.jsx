import { Component } from "react";
import "./ErrorBoundary.css";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ error, info });
    // also log to console for dev
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="error-boundary">
        <h2>Something went wrong rendering the app</h2>
        <pre className="error-boundary__message">{String(this.state.error)}</pre>
        {this.state.info?.componentStack && (
          <details className="error-boundary__stack">
            <summary>Component stack</summary>
            <pre>{this.state.info.componentStack}</pre>
          </details>
        )}
      </div>
    );
  }
}
