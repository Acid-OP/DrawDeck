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

  return (
    <div
      className="fixed"
      style={{
        left: 20,
        bottom: 20,
        zIndex: 200,
        pointerEvents: "auto",
      }}
    >
      <div
        className="relative flex items-center"
        style={{
          borderRadius: 8,
          minWidth: 120,
          height: 34,
          padding: "0 10px",
          fontFamily: "'Inter',sans-serif",
          boxShadow:
            "rgba(0,0,0,0.09) 0px 1.7px 14px 0px,rgba(0,0,0,0.09) 0px 1.2px 6px 0px",
          userSelect: "none",
          touchAction: "manipulation",
          fontWeight: 500,
          fontSize: 14,
          letterSpacing: "0.01em",
          background: theme === "dark" ? "#202026" : "#ececf4",
          position: "relative",
          minHeight: 34,
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
            borderTopLeftRadius: 8,
            borderBottomLeftRadius: 8,
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
            borderTopRightRadius: 8,
            borderBottomRightRadius: 8,
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
            width: 30,
            height: 30,
            borderRadius: 5,
            background: "none",
            border: "none",
            fontWeight: 500,
            fontSize: 18,
            cursor: "pointer",
            zIndex: 2,
            color: theme === "dark" ? "#fff" : "#000",
            marginRight: 2,
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
            minWidth: 50,
            height: 30,
            fontSize: 14,
            fontFamily: "'Inter',sans-serif",
            cursor: "pointer",
            zIndex: 2,
            color: theme === "dark" ? "#fff" : "#000",
            borderRadius: 5,
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
            width: 30,
            height: 30,
            borderRadius: 5,
            background: "none",
            border: "none",
            fontWeight: 500,
            fontSize: 18,
            cursor: "pointer",
            zIndex: 2,
            color: theme === "dark" ? "#fff" : "#000",
            marginLeft: 2,
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

        {/* TOOLTIP */}
        {hovered && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              bottom: 40,
              background: "#fff",
              color: "#23232b",
              borderRadius: 6,
              border: "1px solid #ededed",
              boxShadow:
                "0 3px 20px rgba(0,0,0,0.13), 0 1px 6px 0 rgba(0,0,0,0.07)",
              fontFamily: "'Inter',sans-serif",
              fontWeight: 500,
              fontSize: 12,
              padding: "2px 12px",
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
