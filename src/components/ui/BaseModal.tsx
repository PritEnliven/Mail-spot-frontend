// import { useEffect, useRef } from "react";
// import ReactDOM from "react-dom";
// import Draggable from "react-draggable";

// interface BaseModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   children: React.ReactNode;
//   zIndex?: number;
//   showBackdrop?: boolean;
//   closeOnBackdrop?: boolean;
//   closeOnEsc?: boolean;
//   draggable?: boolean;
//   className?: string;
//   dragHandleSelector?: string;
//   width?: string;
//   maxWidth?: string;
//   minWidth?: string;
//   moduleName?: string;
//   isComposeExpanded?: boolean;
// }

// const modalRoot = document.getElementById("modal-root") || document.body;

// export default function BaseModal({
//   isOpen,
//   onClose,
//   children,
//   zIndex = 1050,
//   showBackdrop = false,          // ← default: NO backdrop
//   closeOnBackdrop = true,
//   closeOnEsc = true,
//   draggable = true,
//   className = "",
//   dragHandleSelector = ".drag-handle",
//   width = "min(90vw, 620px)",
//   maxWidth = "95vw",
//   minWidth = "320px",
//   moduleName = "",
//   isComposeExpanded = false,
// }: BaseModalProps) {
//   const nodeRef = useRef<HTMLDivElement>(null);

//   // ESC key handler
//   useEffect(() => {
//     if (!isOpen || !closeOnEsc) return;

//     const handleEsc = (e: KeyboardEvent) => {
//       if (e.key === "Escape") {
//         onClose();
//       }
//     };

//     window.addEventListener("keydown", handleEsc);
//     return () => window.removeEventListener("keydown", handleEsc);
//   }, [isOpen, closeOnEsc, onClose]);

//   // Body scroll lock (preserves scroll position)
//   useEffect(() => {
//     if (!isOpen) return;

//     const scrollY = window.scrollY;

//     document.body.style.position = "fixed";
//     document.body.style.top = `-${scrollY}px`;
//     document.body.style.width = "100%";
//     document.body.classList.add("modal-open");

//     return () => {
//       document.body.style.position = "";
//       document.body.style.top = "";
//       document.body.style.width = "";
//       document.body.classList.remove("modal-open");
//       window.scrollTo(0, scrollY);
//     };
//   }, [isOpen]);

//   if (!isOpen) return null;

//   // Compose-specific classes
//   const dynamicClassList = moduleName === "compose" ? isComposeExpanded ? "compose-modal-expand" : "compose-modal-unexpand" : "";

//   return ReactDOM.createPortal(
//     <>
//       {/* Backdrop – only rendered when explicitly requested */}
//       {showBackdrop && (
//         <div
//           className="modal-backdrop fade show"
//           style={{ zIndex }}
//           onClick={closeOnBackdrop ? onClose : undefined}
//         />
//       )}

//       <Draggable
//         handle={dragHandleSelector}
//         nodeRef={nodeRef}
//         cancel="input, textarea, button, select, .no-drag"
//         disabled={!draggable}
//       >
//         <div
//           ref={nodeRef}
//           className={`modal fade show d-block ${className}`}
//           style={{
//             position: "fixed",
//             inset: 0,
//             zIndex: zIndex + 1,
//             pointerEvents: "none", // allows clicks to pass to backdrop
//           }}
//           role="dialog"
//         >
//           <div
//             style={{
//                position: "absolute",
//               top: 0,
//               left: 0,
//               right: 0,
//               bottom: 0,
//               margin: "auto",              
//               width: width || "fit-content",
//               height: "fit-content",      
//               maxWidth: maxWidth,
//               maxHeight: "90vh",
//               pointerEvents: "auto",
//             }}
//             className={`modal-content-shadow ${dynamicClassList}`}
//           >
//             {children}
//           </div>
//         </div>
//       </Draggable>
//     </>,
//     modalRoot
//   );
// }




// import { useEffect, useRef, useState, useLayoutEffect } from "react";
// import ReactDOM from "react-dom";
// import Draggable from "react-draggable";

// interface BaseModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   children: React.ReactNode;
//   zIndex?: number;
//   showBackdrop?: boolean;
//   closeOnBackdrop?: boolean;
//   closeOnEsc?: boolean;
//   draggable?: boolean;
//   className?: string;
//   dragHandleSelector?: string;
//   width?: string;
//   maxWidth?: string;
//   minWidth?: string;
//   moduleName?: string;
//   isComposeExpanded?: boolean;
// }

// const modalRoot = document.getElementById("modal-root") || document.body;

// export default function BaseModal({
//   isOpen,
//   onClose,
//   children,
//   zIndex = 1050,
//   showBackdrop = false,
//   closeOnBackdrop = true,
//   closeOnEsc = true,
//   draggable = true,
//   className = "",
//   dragHandleSelector = ".drag-handle",
//   width = "min(90vw, 620px)",
//   maxWidth = "95vw",
//   minWidth = "320px",
//   moduleName = "",
//   isComposeExpanded = false,
// }: BaseModalProps) {
//   const nodeRef = useRef<HTMLDivElement>(null);
//   const contentRef = useRef<HTMLDivElement>(null);
//   const [bounds, setBounds] = useState({ left: 0, top: 0, right: 0, bottom: 0 });

//   const updateBounds = () => {
//     if (contentRef.current) {
//       const { offsetWidth, offsetHeight } = contentRef.current;
//       const screenWidth = window.innerWidth;
//       const screenHeight = window.innerHeight;

//       const topLimit = -((screenHeight - offsetHeight) / 2);
//       const bottomLimit = (screenHeight / 2) + (offsetHeight * 0.4);
//       const horizontalLimit = (screenWidth / 2) + (offsetWidth * 0.4);

//       setBounds({
//         top: topLimit, 
//         bottom: bottomLimit,
//         left: -horizontalLimit,
//         right: horizontalLimit,
//       });
//     }
//   };

//   useLayoutEffect(() => {
//     if (isOpen) {
//       const timer = setTimeout(updateBounds, 50);
//       const resizeObserver = new ResizeObserver(() => updateBounds());
//       if (contentRef.current) resizeObserver.observe(contentRef.current);
      
//       window.addEventListener("resize", updateBounds);
//       return () => {
//         clearTimeout(timer);
//         resizeObserver.disconnect();
//         window.removeEventListener("resize", updateBounds);
//       };
//     }
//   }, [isOpen, width, isComposeExpanded]);

//   // ESC key & Scroll Lock
//   useEffect(() => {
//     if (!isOpen) return;
//     if (closeOnEsc) {
//       const handleEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
//       window.addEventListener("keydown", handleEsc);
//       return () => window.removeEventListener("keydown", handleEsc);
//     }
//   }, [isOpen, closeOnEsc, onClose]);

//   useEffect(() => {
//     if (!isOpen) return;
//     const scrollY = window.scrollY;
//     document.body.style.position = "fixed";
//     document.body.style.top = `-${scrollY}px`;
//     document.body.style.width = "100%";
//     document.body.classList.add("modal-open");
//     return () => {
//       document.body.style.position = "";
//       document.body.style.top = "";
//       document.body.style.width = "";
//       document.body.classList.remove("modal-open");
//       window.scrollTo(0, scrollY);
//     };
//   }, [isOpen]);

//   if (!isOpen) return null;

//   const dynamicClassList = moduleName === "compose" ? (isComposeExpanded ? "compose-modal-expand" : "compose-modal-unexpand") : "";

//   return ReactDOM.createPortal(
//     <>
//       {showBackdrop && (
//         <div
//           className="modal-backdrop fade show"
//           style={{ zIndex, position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)" }}
//           onClick={closeOnBackdrop ? onClose : undefined}
//         />
//       )}

//       <Draggable
//         handle={dragHandleSelector}
//         nodeRef={nodeRef}
//         cancel="input, textarea, button, select, .no-drag"
//         disabled={!draggable}
//         bounds={bounds}
//       >
//         <div
//           ref={nodeRef}
//           className={`modal fade show d-block ${className}`}
//           style={{
//             position: "fixed",
//             inset: 0,
//             zIndex: zIndex + 1,
//             pointerEvents: "none", 
//           }}
//           role="dialog"
//         >
//           <div
//             ref={contentRef}
//             style={{
//               position: "absolute",
//               top: 0, left: 0, right: 0, bottom: 0,
//               margin: "auto",
//               width: width || "fit-content",
//               height: "fit-content",
//               maxWidth: maxWidth,
//               minWidth: minWidth,
//               pointerEvents: "auto",
//             }}
//             className={`modal-content-shadow ${dynamicClassList}`}
//           >
//             {children}
//           </div>
//         </div>
//       </Draggable>
//     </>,
//     modalRoot
//   );
// }



// import { useEffect, useRef, useState, useLayoutEffect } from "react";
// import ReactDOM from "react-dom";
// import Draggable from "react-draggable";

// interface BaseModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   children: React.ReactNode;
//   zIndex?: number;
//   showBackdrop?: boolean;
//   closeOnBackdrop?: boolean;
//   closeOnEsc?: boolean;
//   draggable?: boolean;
//   className?: string;
//   dragHandleSelector?: string;
//   width?: string;
//   maxWidth?: string;
//   minWidth?: string;
//   moduleName?: string;
//   isComposeExpanded?: boolean;
// }

// const modalRoot = document.getElementById("modal-root") || document.body;

// export default function BaseModal({
//   isOpen,
//   onClose,
//   children,
//   zIndex = 1050,
//   showBackdrop = false,
//   closeOnBackdrop = true,
//   closeOnEsc = true,
//   draggable = true,
//   className = "",
//   dragHandleSelector = ".drag-handle",
//   width = "min(90vw, 620px)",
//   maxWidth = "95vw",
//   minWidth = "320px",
//   moduleName = "",
//   isComposeExpanded = false,
// }: BaseModalProps) {
//   const nodeRef = useRef<HTMLDivElement>(null);
//   const contentRef = useRef<HTMLDivElement>(null);
//   const [bounds, setBounds] = useState({ left: 0, top: 0, right: 0, bottom: 0 });

//   const isCompose = moduleName === "compose";

//   const updateBounds = () => {
//     if (contentRef.current) {
//       const { offsetWidth, offsetHeight } = contentRef.current;
//       const screenWidth = window.innerWidth;
//       const screenHeight = window.innerHeight;

//       const visibleThreshold = 100; // Screen ke andar kitna rehna chahiye

//       if (isCompose) {
//         // Compose Modal (Bottom-Right based)
//         // Iska 0,0 position screen ka bottom-right corner (minus 20px margin) hai
//         setBounds({
//           top: -(screenHeight - offsetHeight - 20), // Top edge par lock (bahar nahi jayega)
//           bottom: offsetHeight - visibleThreshold + 20, // Bottom me 100px dikhega
//           left: -(screenWidth - visibleThreshold - 20), // Left me 100px dikhega
//           right: offsetWidth - visibleThreshold + 20, // Right me 100px dikhega
//         });
//       } else {
//         // Center Modal (margin: auto based)
//         const halfW = (screenWidth - offsetWidth) / 2;
//         const halfH = (screenHeight - offsetHeight) / 2;

//         setBounds({
//           top: -halfH, // Top edge par lock
//           bottom: halfH + (offsetHeight - visibleThreshold),
//           left: -(halfW + (offsetWidth - visibleThreshold)),
//           right: halfW + (offsetWidth - visibleThreshold),
//         });
//       }
//     }
//   };

//   useLayoutEffect(() => {
//     if (isOpen) {
//       const timer = setTimeout(updateBounds, 100);
//       const resizeObserver = new ResizeObserver(() => updateBounds());
//       if (contentRef.current) resizeObserver.observe(contentRef.current);
      
//       window.addEventListener("resize", updateBounds);
//       return () => {
//         clearTimeout(timer);
//         resizeObserver.disconnect();
//         window.removeEventListener("resize", updateBounds);
//       };
//     }
//   }, [isOpen, width, isComposeExpanded, moduleName]);

//   // Standard Handlers (ESC & Scroll Lock)
//   useEffect(() => {
//     if (!isOpen) return;
//     if (closeOnEsc) {
//       const handleEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
//       window.addEventListener("keydown", handleEsc);
//       return () => window.removeEventListener("keydown", handleEsc);
//     }
//   }, [isOpen, closeOnEsc, onClose]);

//   useEffect(() => {
//     if (!isOpen) return;
//     const scrollY = window.scrollY;
//     document.body.style.position = "fixed";
//     document.body.style.top = `-${scrollY}px`;
//     document.body.style.width = "100%";
//     document.body.classList.add("modal-open");
//     return () => {
//       document.body.style.position = "";
//       document.body.style.top = "";
//       document.body.style.width = "";
//       document.body.classList.remove("modal-open");
//       window.scrollTo(0, scrollY);
//     };
//   }, [isOpen]);

//   if (!isOpen) return null;

//   const dynamicClassList = isCompose ? (isComposeExpanded ? "compose-modal-expand" : "compose-modal-unexpand") : "";

//   return ReactDOM.createPortal(
//     <>
//       {showBackdrop && (
//         <div
//           className="modal-backdrop fade show"
//           style={{ zIndex, position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)" }}
//           onClick={closeOnBackdrop ? onClose : undefined}
//         />
//       )}

//       <Draggable
//         handle={dragHandleSelector}
//         nodeRef={nodeRef}
//         cancel="input, textarea, button, select, .no-drag"
//         disabled={!draggable}
//         bounds={bounds}
//       >
//         <div
//           ref={nodeRef}
//           className={`modal fade show d-block ${className}`}
//           style={{
//             position: "fixed",
//             inset: 0,
//             zIndex: zIndex + 1,
//             pointerEvents: "none", 
//           }}
//           role="dialog"
//         >
//           <div
//             ref={contentRef}
//             style={{
//               position: "absolute",
//               width: width || "fit-content",
//               height: "fit-content",
//               maxWidth: maxWidth,
//               minWidth: minWidth,
//               pointerEvents: "auto",
//               // Initial position logic
//               ...(isCompose 
//                 ? { bottom: "20px", right: "20px", left: "auto", top: "auto", margin: "0" } 
//                 : { inset: 0, margin: "auto" }
//               )
//             }}
//             className={`modal-content-shadow ${dynamicClassList}`}
//           >
//             {children}
//           </div>
//         </div>
//       </Draggable>
//     </>,
//     modalRoot
//   );
// }



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

  const [controlledPosition, setControlledPosition] = useState({ x: 0, y: 0 });
  const [bounds, setBounds] = useState({ left: 0, top: 0, right: 0, bottom: 0 });

  useEffect(() => {
    setControlledPosition({ x: 0, y: 0 });
  }, [isExpanded, isCompose]);

  const updateBounds = () => {
    if (!contentRef.current) return;

    const { offsetWidth: modalWidth, offsetHeight: modalHeight } = contentRef.current;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    const VISIBLE_THRESHOLD = 100; 

    let newBounds;

    if (isCompose && !isExpanded) {
      // Bottom-right anchored compose modal
      newBounds = {
        top: -(screenHeight - modalHeight - 20),          
        bottom: modalHeight - VISIBLE_THRESHOLD + 20,     
        left: -(screenWidth - VISIBLE_THRESHOLD - 20),    
        right: modalWidth - VISIBLE_THRESHOLD + 20,       
      };
    } else {
      // Centered modal
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
    if (!isOpen) return;

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
  }, [isOpen, isExpanded, width, maxWidth, minWidth, isCompose]);

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

  if (!isOpen) return null;

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
      {showBackdrop && (
        <div
          className="modal-backdrop fade show " 
          style={{
            zIndex,
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
          onClick={closeOnBackdrop ? onClose : undefined}
        />
      )}

      <Draggable
        handle={dragHandleSelector}
        nodeRef={nodeRef}
        cancel="input, textarea, button:not(.drag-handle-btn), select, .no-drag"
        disabled={!draggable}
        bounds={bounds}
        position={controlledPosition}
        onStop={handleStop}
      >
        <div
          ref={nodeRef}
          className={`modal fade show d-block ${className}`}
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