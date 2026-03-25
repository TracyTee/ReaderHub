/** ErrorBoundary component — catches JavaScript errors in child components and displays a fallback UI instead of crashing the whole app.
 * Wraps around components that might throw errors, such as BookCard and BookModal.
 * If an error occurs, it shows a user-friendly message and a button to try again (which resets the error state).
 * Also logs the error details to the console for debugging.
 */
import { Component } from "react";

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error("ErrorBoundary caught:", error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary" role="alert">
                    <h3>Something went wrong</h3>
                    <p>{this.state.error?.message || "An unexpected error occurred. Please try refreshing the page."}</p>
                    <button
                        className="btn btn-ghost btn-sm"
                        style={{ marginTop: 16 }}
                        onClick={() => this.setState({ hasError: false, error: null })}
                    >
                        Try again
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
