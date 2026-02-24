import { NodeViewWrapper } from "@tiptap/react";
import { NodeViewProps } from "@tiptap/core";
import {
  useMemo,
  useRef,
  useState,
  useEffect,
  useCallback,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { Download, Maximize2, RefreshCw, X } from "lucide-react";

import { saveImageFile } from "@/utils/invoke";

const MIN_IMAGE_WIDTH_PERCENT = 15;
const MAX_IMAGE_WIDTH_PERCENT = 100;

function clampWidthPercent(value: number) {
  return Math.max(MIN_IMAGE_WIDTH_PERCENT, Math.min(MAX_IMAGE_WIDTH_PERCENT, value));
}

function parseWidthPercent(width: string) {
  const trimmed = width.trim();
  if (!trimmed.endsWith("%")) {
    return null;
  }

  const parsed = Number.parseFloat(trimmed.slice(0, -1));
  return Number.isFinite(parsed) ? clampWidthPercent(parsed) : null;
}

function deriveFileNameFromSrc(src: string, alt?: string) {
  const normalizedAlt = (alt || "").trim();
  if (normalizedAlt) {
    return normalizedAlt.replace(/[\\/:*?"<>|]+/g, "_");
  }

  try {
    const parsed = new URL(src, window.location.href);
    const file = parsed.pathname.split("/").filter(Boolean).pop();
    if (file) {
      return file;
    }
  } catch {
    // fall back
  }

  return "image";
}

function normalizeWidth(width: unknown) {
  if (typeof width === "number" && Number.isFinite(width)) {
    return `${width}px`;
  }

  if (typeof width !== "string") {
    return "100%";
  }

  const trimmed = width.trim();
  if (!trimmed) {
    return "100%";
  }

  return /^\d+(\.\d+)?$/.test(trimmed) ? `${trimmed}px` : trimmed;
}

export const ImageNodeView = ({ node, updateAttributes }: NodeViewProps) => {
  const { src, attachmentId, alt, align, width, height } = node.attrs;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const draftWidthRef = useRef<string | null>(null);
  const skipOpenOnClickRef = useRef(false);
  const [draftWidth, setDraftWidth] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [downloadState, setDownloadState] = useState<"idle" | "done" | "error">("idle");

  const loading = useMemo(() => !src && attachmentId === "uploading", [src, attachmentId]);
  const error = useMemo(() => !src && attachmentId && attachmentId !== "uploading", [src, attachmentId]);
  const resolvedWidth = draftWidth ?? normalizeWidth(width);
  const widthPercent = parseWidthPercent(resolvedWidth);
  const widthLabel = widthPercent === null ? resolvedWidth : `${Math.round(widthPercent)}%`;

  const closePreview = useCallback(() => {
    setIsPreviewOpen(false);
    setDownloadState("idle");
  }, []);

  const triggerDownload = useCallback(async () => {
    if (!src) return;

    try {
      await saveImageFile({
        suggestedName: deriveFileNameFromSrc(src, alt),
        sourceUrl: src,
        attachmentId: typeof attachmentId === "string" && attachmentId !== "uploading"
          ? attachmentId
          : undefined,
      });
      setDownloadState("done");
    } catch (downloadError) {
      console.error("Failed to save image:", downloadError);
      setDownloadState("error");
    }
  }, [src, alt, attachmentId]);

  useEffect(() => {
    if (!isPreviewOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const key = event.key.toLowerCase();
      if (key === "escape") {
        event.preventDefault();
        closePreview();
        return;
      }

      if (key === "d") {
        event.preventDefault();
        void triggerDownload();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isPreviewOpen, triggerDownload, closePreview]);

  const getAlignmentClass = () => {
    switch (align) {
      case "left":
        return "image-align-left";
      case "right":
        return "image-align-right";
      case "center":
      default:
        return "image-align-center";
    }
  };

  const stopNodeSelection = useCallback((event: ReactMouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const openPreview = useCallback((event: ReactMouseEvent<HTMLElement>) => {
    if (!src || loading || error || isResizing) {
      return;
    }
    if (skipOpenOnClickRef.current) {
      skipOpenOnClickRef.current = false;
      return;
    }

    stopNodeSelection(event);
    setDownloadState("idle");
    setIsPreviewOpen(true);
  }, [src, loading, error, isResizing, stopNodeSelection]);

  const downloadImage = useCallback((event: ReactMouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    void triggerDownload();
  }, [triggerDownload]);

  const resetImageWidth = useCallback((event: ReactMouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    updateAttributes({ width: "100%" });
  }, [updateAttributes]);

  const previewLightbox = isPreviewOpen && src && typeof document !== "undefined"
    ? createPortal(
      <div
        className="image-lightbox"
        role="dialog"
        aria-modal="true"
        onClick={closePreview}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div
          className="image-lightbox-panel"
          onClick={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="image-lightbox-header">
            <div className="image-lightbox-title-wrap">
              <p className="image-lightbox-eyebrow">image preview</p>
              <div className="image-lightbox-title">{alt || "untitled image"}</div>
            </div>
            <div className="image-lightbox-actions">
              <button type="button" className="image-lightbox-icon-button" onClick={downloadImage}>
                <Download size={14} />
                <span>{downloadState === "done" ? "saved" : downloadState === "error" ? "save failed" : "save as"}</span>
              </button>
              <button type="button" className="image-lightbox-close" onClick={closePreview} aria-label="Close preview">
                <X size={15} />
              </button>
            </div>
          </div>

          <div className="image-lightbox-body image-lightbox-body-simple">
            <div className="image-lightbox-stage">
              <img
                className="image-lightbox-image"
                src={src}
                alt={alt || ""}
                draggable={false}
              />
            </div>
          </div>

          <div className="image-lightbox-shortcuts">
            <span><kbd>Esc</kbd> close</span>
            <span><kbd>D</kbd> save image</span>
          </div>
        </div>
      </div>,
      document.body,
    )
    : null;

  const handleResizeStart = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const editorRoot = wrapper.closest(".ProseMirror") as HTMLElement | null;
    const editorWidth =
      editorRoot?.getBoundingClientRect().width ??
      wrapper.parentElement?.getBoundingClientRect().width ??
      wrapper.getBoundingClientRect().width;

    if (!editorWidth) return;

    const startX = event.clientX;
    const startWidth = wrapper.getBoundingClientRect().width;
    const pointerTarget = event.currentTarget;
    const pointerId = event.pointerId;
    pointerTarget.setPointerCapture(pointerId);
    setIsResizing(true);

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const nextWidthPx = Math.max((MIN_IMAGE_WIDTH_PERCENT / 100) * editorWidth, startWidth + deltaX);
      const nextWidth = `${clampWidthPercent((nextWidthPx / editorWidth) * 100).toFixed(2)}%`;
      draftWidthRef.current = nextWidth;
      setDraftWidth(nextWidth);
    };

    const finishResize = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", finishResize);
      window.removeEventListener("pointercancel", finishResize);

      if (pointerTarget.hasPointerCapture(pointerId)) {
        pointerTarget.releasePointerCapture(pointerId);
      }

      const nextWidth = draftWidthRef.current;
      if (nextWidth) {
        updateAttributes({ width: nextWidth });
      }

      skipOpenOnClickRef.current = true;
      draftWidthRef.current = null;
      setDraftWidth(null);
      setIsResizing(false);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", finishResize);
    window.addEventListener("pointercancel", finishResize);
  }, [updateAttributes]);

  if (loading) {
    return (
      <NodeViewWrapper className="image-node">
        <div className={`image-wrapper ${getAlignmentClass()}`}>
          <div className="image-frame" style={{ width: resolvedWidth }}>
            <div className="image-loading">
              <div className="spinner" />
              <span>Uploading image...</span>
            </div>
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  if (error) {
    return (
      <NodeViewWrapper className="image-node">
        <div className={`image-wrapper ${getAlignmentClass()}`}>
          <div className="image-frame" style={{ width: resolvedWidth }}>
            <div className="image-error">
              <span>Failed to load image</span>
            </div>
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="image-node" data-resize-state={isResizing ? "true" : "false"}>
      <div className={`image-wrapper ${getAlignmentClass()}`}>
        <div
          ref={wrapperRef}
          className="image-frame"
          style={{ width: resolvedWidth }}
          data-resize-wrapper
          onMouseDown={stopNodeSelection}
          onClick={openPreview}
        >
          <img
            src={src}
            alt={alt || ""}
            draggable={false}
            onMouseDown={stopNodeSelection}
            style={{
              maxHeight: height || "600px",
              width: "100%",
              height: "auto",
              objectFit: "contain",
            }}
          />
          <div className="image-hover-actions">
            <div className="image-hover-meta">
              <span className="image-hover-chip">{widthLabel}</span>
            </div>
            <div className="image-hover-buttons">
              <button
                type="button"
                className="image-hover-open"
                onMouseDown={(event) => event.stopPropagation()}
                onClick={openPreview}
              >
                <Maximize2 size={13} />
                <span>preview</span>
              </button>
              <button
                type="button"
                className="image-hover-open"
                onMouseDown={(event) => event.stopPropagation()}
                onClick={resetImageWidth}
              >
                <RefreshCw size={13} />
                <span>reset size</span>
              </button>
            </div>
          </div>
          <button
            type="button"
            className="image-resize-handle"
            data-resize-handle="right"
            onPointerDown={handleResizeStart}
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            aria-label="Resize image"
          />
        </div>
      </div>
      {previewLightbox}
    </NodeViewWrapper>
  );
};
