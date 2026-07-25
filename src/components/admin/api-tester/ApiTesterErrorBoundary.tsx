"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AdminPanel, adminBtnPrimary } from "@/components/admin/ui";

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

/**
 * Friendly recovery UI for unexpected render failures in the API Tester.
 * Retry remounts children without a full page refresh.
 */
export class ApiTesterErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV === "development") {
      console.error("[api-tester] ErrorBoundary", error, info.componentStack);
    }
  }

  private retry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <AdminPanel
          title="API Tester"
          description="Something went wrong while rendering this page."
        >
          <div
            role="alert"
            className="space-y-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-5"
          >
            <p className="text-sm text-red-50/95">
              The API Tester hit an unexpected error. Your API key in this tab
              is unchanged — try again without refreshing the page.
            </p>
            <p className="font-mono text-[11px] text-red-100/70">
              {this.state.error.message || "Unknown error"}
            </p>
            <button
              type="button"
              className={adminBtnPrimary}
              onClick={this.retry}
              aria-label="Retry API Tester"
            >
              Try again
            </button>
          </div>
        </AdminPanel>
      );
    }

    return this.props.children;
  }
}
