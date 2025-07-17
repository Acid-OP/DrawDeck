import React, { useState } from "react";

type Theme = "dark" | "light";

interface ZoomBarProps {
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  theme: Theme;
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
}

export const ZoomBar: React.FC<ZoomBarProps> = ({
  zoom,
  setZoom,
  theme,
  minZoom = 0.2,
  maxZoom = 4,
  zoomStep = 0.1,
}) => {
  const [hovered, setHovered] = useState<"minus" | "plus" | "reset" | null>(null);

  // Section highlights for – and +
  const leftFrac = 36;
  const rightFrac = 64;

  // Tooltip text per hovered section
  const tooltipText =
    hovered === "minus"
      ? "Zoom out"
      : hovered === "plus"
      ? "Zoom in"
      : hovered === "reset"
      ? "Reset"
      : "";

  return (
    <div
      className="fixed"
      style={{
        left: 24,
        bottom: 24,
        zIndex: 200,
        pointerEvents: "auto",
      }}
    >
      <div
        className="relative flex items-center"
        style={{
          borderRadius: 10,
          minWidth: 142,
          height: 40,
          padding: "0 12px",
          fontFamily: "'Inter',sans-serif",
          boxShadow:
            "rgba(0,0,0,0.09) 0px 2px 16px 0px,rgba(0,0,0,0.09) 0px 1.5px 7px 0px",
          userSelect: "none",
          touchAction: "manipulation",
          fontWeight: 500,
          fontSize: 16,
          letterSpacing: "0.01em",
          background: theme === "dark" ? "#202026" : "#ececf4",
          position: "relative",
          minHeight: 40,
          display: "flex",
          alignItems: "center",
        }}
      >
        {/* Section hover background: left (minus) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            right: `${100 - leftFrac}%`,
            background:
              hovered === "minus"
                ? theme === "dark"
                  ? "#2e2d39"
                  : "#eeedfc"
                : "transparent",
            borderTopLeftRadius: 10,
            borderBottomLeftRadius: 10,
            transition: "background 0.13s",
            zIndex: 1,
            pointerEvents: "none",
          }}
        />
        {/* Section hover background: right (plus) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: `${rightFrac}%`,
            bottom: 0,
            right: 0,
            background:
              hovered === "plus"
                ? theme === "dark"
                  ? "#2e2d39"
                  : "#eeedfc"
                : "transparent",
            borderTopRightRadius: 10,
            borderBottomRightRadius: 10,
            transition: "background 0.13s",
            zIndex: 1,
            pointerEvents: "none",
          }}
        />

        {/* MINUS */}
        <button
          aria-label="Zoom out"
          type="button"
          onMouseEnter={() => setHovered("minus")}
          onMouseLeave={() => setHovered(null)}
          onFocus={() => setHovered("minus")}
          onBlur={() => setHovered(null)}
          style={{
            width: 36,
            height: 36,
            borderRadius: 6,
            background: "none",
            border: "none",
            fontWeight: 500,
            fontSize: 20,
            cursor: "pointer",
            zIndex: 2,
            color: theme === "dark" ? "#fff" : "#000",
            marginRight: 3,
            marginLeft: 1,
            outline: "none",
            position: "relative",
          }}
          tabIndex={0}
          onClick={() =>
            setZoom((z: number) =>
              Math.max(Number((z - zoomStep).toFixed(2)), minZoom)
            )
          }
        >
          –
        </button>

        {/* 100% (reset/percent) */}
        <button
          type="button"
          aria-label="Reset zoom to 100%"
          onMouseEnter={() => setHovered("reset")}
          onMouseLeave={() => setHovered(null)}
          onFocus={() => setHovered("reset")}
          onBlur={() => setHovered(null)}
          style={{
            background: "none",
            border: "none",
            fontWeight: 500,
            outline: "none",
            minWidth: 60,
            height: 36,
            fontSize: 16,
            fontFamily: "'Inter',sans-serif",
            cursor: "pointer",
            zIndex: 2,
            color: theme === "dark" ? "#fff" : "#000",
            borderRadius: 6,
          }}
          onClick={() => setZoom(1)}
          tabIndex={0}
        >
          {Math.round(zoom * 100)}%
        </button>

        {/* PLUS */}
        <button
          aria-label="Zoom in"
          type="button"
          onMouseEnter={() => setHovered("plus")}
          onMouseLeave={() => setHovered(null)}
          onFocus={() => setHovered("plus")}
          onBlur={() => setHovered(null)}
          style={{
            width: 36,
            height: 36,
            borderRadius: 6,
            background: "none",
            border: "none",
            fontWeight: 500,
            fontSize: 20,
            cursor: "pointer",
            zIndex: 2,
            color: theme === "dark" ? "#fff" : "#000",
            marginLeft: 3,
            marginRight: 1,
            outline: "none",
            position: "relative",
          }}
          tabIndex={0}
          onClick={() =>
            setZoom((z: number) =>
              Math.min(Number((z + zoomStep).toFixed(2)), maxZoom)
            )
          }
        >
          +
        </button>

        {/* TOOLTIP - above the whole bar */}
        {hovered && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              bottom: 48,
              background: "#fff",
              color: "#23232b",
              borderRadius: 7,
              border: "1px solid #ededed",
              boxShadow:
                "0 4px 24px rgba(0,0,0,0.13), 0 1.5px 7px 0 rgba(0,0,0,0.07)",
              fontFamily: "'Inter',sans-serif",
              fontWeight: 500,
              fontSize: 13,
              padding: "3px 15px",
              whiteSpace: "nowrap",
              opacity: 0.99,
              zIndex: 9999,
              transition: "opacity 0.13s",
              pointerEvents: "none",
            }}
          >
            {tooltipText}
          </div>
        )}
      </div>
    </div>
  );
};
