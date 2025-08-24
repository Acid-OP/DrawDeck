import React, { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";

interface ZoomBarProps {
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
}

export const ZoomBar: React.FC<ZoomBarProps> = ({
  zoom,
  setZoom,
  minZoom = 0.2,
  maxZoom = 4,
  zoomStep = 0.1,
}) => {
  const { theme } = useTheme();
  const [hovered, setHovered] = useState<"minus" | "plus" | "reset" | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const leftFrac = 36;
  const rightFrac = 64;
  const tooltipText =
    hovered === "minus"
      ? "Zoom out"
      : hovered === "plus"
      ? "Zoom in"
      : hovered === "reset"
      ? "Reset"
      : "";

  const buttonBaseStyle: React.CSSProperties = {
    height: 36,
    borderRadius: 4,
    background: "none",
    border: "none",
    fontWeight: 400,
    cursor: "pointer",
    zIndex: 2,
    color: theme === "dark" ? "#e9ecef" : "#000000",
    outline: "none",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
    transition: "color 0.15s ease",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  };

  const containerStyle = isMobile
    ? { position: "relative" as const, zIndex: 2, pointerEvents: "auto" as const }
    : { position: "fixed" as const, left: 20, bottom: 20, zIndex: 200, pointerEvents: "auto" as const };

  const background = theme === "dark" ? "#232329" : "#ececf4";

  return (
    <div className={isMobile ? "relative" : "fixed"} style={containerStyle}>
      <div
        className={`relative flex items-center ${isMobile && theme === "dark" ? "border border-black" : ""}`}
        style={{
          borderRadius: 8,
          minWidth: 120,
          height: 36,
          padding: "0 8px",
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          boxShadow: isMobile
            ? "none"
            : "rgba(0,0,0,0.12) 0px 2px 10px 0px, rgba(0,0,0,0.08) 0px 1px 4px 0px",
          userSelect: "none",
          touchAction: "manipulation",
          fontWeight: 400,
          fontSize: 13,
          letterSpacing: "-0.01em",
          background,
          position: "relative",
          minHeight: 36,
          display: "flex",
          alignItems: "center",
        }}
      >
        {/* Hover backgrounds */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            right: `${100 - leftFrac}%`,
            background: hovered === "minus" ? "rgba(255,255,255,0.05)" : "transparent",
            borderTopLeftRadius: 8,
            borderBottomLeftRadius: 8,
            transition: "background 0.15s ease",
            zIndex: 1,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: `${rightFrac}%`,
            bottom: 0,
            right: 0,
            background: hovered === "plus" ? "rgba(255,255,255,0.05)" : "transparent",
            borderTopRightRadius: 8,
            borderBottomRightRadius: 8,
            transition: "background 0.15s ease",
            zIndex: 1,
            pointerEvents: "none",
          }}
        />

        {/* Minus */}
        <button
          aria-label="Zoom out"
          type="button"
          onMouseEnter={() => setHovered("minus")}
          onMouseLeave={() => setHovered(null)}
          style={{ ...buttonBaseStyle, width: 40, fontSize: 18 }}
          onClick={() => setZoom(z => Math.max(Number((z - zoomStep).toFixed(2)), minZoom))}
        >
          −
        </button>

        {/* Percent / Reset */}
        <button
          type="button"
          aria-label="Reset zoom to 100%"
          onMouseEnter={() => setHovered("reset")}
          onMouseLeave={() => setHovered(null)}
          style={{ ...buttonBaseStyle, width: 50, fontSize: 14 }}
          onClick={() => setZoom(1)}
        >
          {Math.round(zoom * 100)}%
        </button>

        {/* Plus */}
        <button
          aria-label="Zoom in"
          type="button"
          onMouseEnter={() => setHovered("plus")}
          onMouseLeave={() => setHovered(null)}
          style={{ ...buttonBaseStyle, width: 40, fontSize: 18 }}
          onClick={() => setZoom(z => Math.min(Number((z + zoomStep).toFixed(2)), maxZoom))}
        >
          +
        </button>

        {/* Tooltip */}
        {hovered && !isMobile && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              bottom: 42,
              background: "#ffffff",
              color: "#1e1e1e",
              borderRadius: 6,
              border: "1px solid #e0e0e0",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.10)",
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              fontWeight: 300,
              fontSize: 12,
              padding: "6px 10px",
              whiteSpace: "nowrap",
              opacity: 1,
              zIndex: 9999,
              transition: "opacity 0.15s ease",
              pointerEvents: "none",
              letterSpacing: "-0.01em",
            }}
          >
            {tooltipText}
          </div>
        )}
      </div>
    </div>
  );
};
