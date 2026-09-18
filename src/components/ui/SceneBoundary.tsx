import { Component, type ErrorInfo, type ReactNode } from "react";
import { supportsWebGL } from "@/lib/webgl";

interface SceneBoundaryProps {
  /** Rendered in place of the scene if it throws, e.g. no WebGL or a failed lazy-chunk load. */
  fallback: ReactNode;
  /** Label used in the logged error, to tell scenes apart. */
  name: string;
  children: ReactNode;
}

interface SceneBoundaryState {
  hasError: boolean;
}

/**
 * Renders a 3D scene only when WebGL is available, and contains render or chunk-load
 * failures inside that scene so the rest of the page keeps working.
 * Error boundaries must be class components; this is the only one in the codebase.
 */
export class SceneBoundary extends Component<SceneBoundaryProps, SceneBoundaryState> {
  override state: SceneBoundaryState = { hasError: false };

  static getDerivedStateFromError(): SceneBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[scene:${this.props.name}] failed to render`, error, info.componentStack);
  }

  override render(): ReactNode {
    return this.state.hasError || !supportsWebGL() ? this.props.fallback : this.props.children;
  }
}
