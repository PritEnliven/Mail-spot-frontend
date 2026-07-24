import { BREAKPOINTS } from "@constants/breakpoint";
import { useEffect, useRef, useState, useLayoutEffect } from "react";
import ReactDOM from "react-dom";
import Draggable, { type DraggableData, type DraggableEvent } from "react-draggable";

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  zIndex?: number;
  showBackdrop?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  draggable?: boolean;
  className?: string;
  dragHandleSelector?: string;
  width?: string;
  maxWidth?: string;
  minWidth?: string;
  moduleName?: string;
  isComposeExpanded?: boolean;
}

const ANIMATION_DURATION = 200; // ms — match Bootstrap's modal transition
const MODAL_BACKDROP_MQ = `(max-width: ${BREAKPOINTS.modalBackdrop}px)`;

const modalRoot = document.getElementById("modal-root") || document.body;

export default function BaseModal({
  isOpen,
  onClose,
  children,
  zIndex = 1050,
  showBackdrop = false,
  closeOnBackdrop = true,
  closeOnEsc = true,
  draggable = true,
  className = "",
  dragHandleSelector = ".drag-handle",
  width = "min(90vw, 620px)",
  maxWidth = "95vw",
  minWidth = "320px",
  moduleName = "",
  isComposeExpanded = false,
}: BaseModalProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const isCompose = moduleName === "compose";
  const isExpanded = isCompose && isComposeExpanded;

  // --- Animation state ---
  // `mounted`  controls whether the DOM node exists at all
  // `visible`  controls whether `.show` is applied (triggers CSS transition)
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isNarrowViewport, setIsNarrowViewport] = useState(
    () => typeof window !== "undefined" && window.matchMedia(MODAL_BACKDROP_MQ).matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(MODAL_BACKDROP_MQ);
    const onChange = (event: MediaQueryListEvent) => setIsNarrowViewport(event.matches);

    setIsNarrowViewport(mediaQuery.matches);
    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }, []);

  const shouldShowBackdrop = showBackdrop || isNarrowViewport;
  const canDrag = draggable && !isNarrowViewport;

  useEffect(() => {
    if (isOpen) {
      // 1. Mount the DOM node first (without .show)
      setMounted(true);
      // 2. One frame later add .show so CSS transition fires
      const raf = requestAnimationFrame(() => {
        setVisible(true);
      });
      return () => cancelAnimationFrame(raf);
    } else {
      // 1. Remove .show → CSS transition plays
      setVisible(false);
      // 2. After transition completes, unmount
      const timer = setTimeout(() => setMounted(false), ANIMATION_DURATION);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const [controlledPosition, setControlledPosition] = useState({ x: 0, y: 0 });
  const [bounds, setBounds] = useState({ left: 0, top: 0, right: 0, bottom: 0 });

  useEffect(() => {
    setControlledPosition({ x: 0, y: 0 });
  }, [isExpanded, isCompose, isNarrowViewport]);

  const updateBounds = () => {
    if (!contentRef.current) return;

    const { offsetWidth: modalWidth, offsetHeight: modalHeight } = contentRef.current;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    const VISIBLE_THRESHOLD = 100;

    let newBounds;

    if (isCompose && !isExpanded) {
      newBounds = {
        top: -(screenHeight - modalHeight - 20),
        bottom: modalHeight - VISIBLE_THRESHOLD + 20,
        left: -(screenWidth - VISIBLE_THRESHOLD - 20),
        right: modalWidth - VISIBLE_THRESHOLD + 20,
      };
    } else {
      const halfWidth = (screenWidth - modalWidth) / 2;
      const halfHeight = (screenHeight - modalHeight) / 2;

      newBounds = {
        top: -halfHeight,
        bottom: halfHeight + (modalHeight - VISIBLE_THRESHOLD),
        left: -(halfWidth + (modalWidth - VISIBLE_THRESHOLD)),
        right: halfWidth + (modalWidth - VISIBLE_THRESHOLD),
      };
    }

    setBounds(newBounds);
  };

  useLayoutEffect(() => {
    if (!mounted) return;

    const timer = setTimeout(updateBounds, 150);

    const ro = new ResizeObserver(() => {
      clearTimeout(timer);
      setTimeout(updateBounds, 80);
    });

    if (contentRef.current) ro.observe(contentRef.current);
    window.addEventListener("resize", updateBounds);

    return () => {
      clearTimeout(timer);
      ro.disconnect();
      window.removeEventListener("resize", updateBounds);
    };
  }, [mounted, isExpanded, width, maxWidth, minWidth, isCompose]);

  // ESC close
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [isOpen, closeOnEsc, onClose]);

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.body.classList.add("modal-open");

    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.classList.remove("modal-open");
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  // Nothing in DOM until first open
  if (!mounted) return null;

  const dynamicClass = isCompose
    ? isExpanded
      ? "compose-modal-expand"
      : "compose-modal-unexpand"
    : "";

  const modalHidden = isOpen ? "modal-show-open" : "modal-hidden-close";

  const handleStop = (_: DraggableEvent, data: DraggableData) => {
    setControlledPosition({ x: data.x, y: data.y });
  };

  return ReactDOM.createPortal(
    <>
      {shouldShowBackdrop && (
        <div
          className={`modal-backdrop fade${visible ? " show" : ""}`}
          style={{
            zIndex,
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            transition: `opacity ${ANIMATION_DURATION}ms ease`,
          }}
          onClick={closeOnBackdrop ? onClose : undefined}
        />
      )}

      <Draggable
        handle={dragHandleSelector}
        nodeRef={nodeRef}
        cancel="input, textarea, button:not(.drag-handle-btn), select, .no-drag"
        disabled={!canDrag}
        bounds={bounds}
        position={controlledPosition}
        onStop={handleStop}
      >
        <div
          ref={nodeRef}
          className={`modal fade${visible ? " show d-block" : ""} ${className}`}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: zIndex + 1,
            pointerEvents: "none",
          }}
          role="dialog"
        >
          <div
            ref={contentRef}
            style={{
              position: "absolute",
              width: width || "fit-content",
              height: "fit-content",
              maxWidth,
              minWidth,
              pointerEvents: "auto",
              ...(isCompose && !isExpanded
                ? { bottom: "20px", right: "20px", top: "auto", left: "auto", margin: 0 }
                : { top: 0, left: 0, right: 0, bottom: 0, margin: "auto" }
              ),
            }}
            className={`modal-content-shadow ${dynamicClass} ${modalHidden}`}
          >
            {children}
          </div>
        </div>
      </Draggable>
    </>,
    modalRoot
  );
}