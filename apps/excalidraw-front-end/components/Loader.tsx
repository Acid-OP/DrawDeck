"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ballSize = 64;
const spacing = 100; // spacing between icons

const IconWrapper = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      width: ballSize,
      height: ballSize,
      position: "absolute",
    }}
  >
    {children}
  </div>
);

const GreenSquare = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 640 640"
    style={{
      width: "100%",
      height: "100%",
    }}
  >
    <path
      fill="#55e76e"
      stroke="black"
      strokeWidth="8"
      d="M160 96L480 96C515.3 96 544 124.7 544 160L544 480C544 515.3 515.3 544 480 544L160 544C124.7 544 96 515.3 96 480L96 160C96 124.7 124.7 96 160 96z"
    />
  </svg>
);

const YellowDiamond = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 640 640"
    style={{
      width: "100%",
      height: "100%",
    }}
  >
    <path
      fill="#f9d144"
      stroke="black"
      strokeWidth="8"
      d="M81 279L279 81C289.9 70.1 304.6 64 320 64C335.4 64 350.1 70.1 361 81L559 279C569.9 289.9 576 304.6 576 320C576 335.4 569.9 350.1 559 361L361 559C350.1 569.9 335.4 576 320 576C304.6 576 289.9 569.9 279 559L81 361C70.1 350.1 64 335.4 64 320C64 304.6 70.1 289.9 81 279z"
    />
  </svg>
);

const RedCircle = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 640 640"
    style={{
      width: "100%",
      height: "100%",
    }}
  >
    <path
      fill="#ff7d7d"
      stroke="black"
      strokeWidth="8"
      d="M64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576C178.6 576 64 461.4 64 320z"
    />
  </svg>
);

const LoaderAnimation = () => {
  const [step, setStep] = useState<"blue-gray" | "blue-purple" | "done">("blue-gray");

  const [positions, setPositions] = useState({
    blue: 0,
    gray: 1,
    purple: 2,
  });

  const getX = (index: number) => {
    return index * spacing;
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (step === "blue-gray") {
        setPositions((prev) => ({
          ...prev,
          blue: 1,
          gray: 0,
        }));
        setStep("blue-purple");
      } else if (step === "blue-purple") {
        setPositions((prev) => ({
          ...prev,
          blue: 2,
          purple: 1,
        }));
        setStep("done");
      }
    }, 600);

    return () => clearTimeout(timeout);
  }, [step]);

  const renderBall = (
    key: string,
    index: number,
    type: "square" | "diamond" | "circle"
  ) => {
    const Icon =
      type === "square"
        ? GreenSquare
        : type === "diamond"
        ? YellowDiamond
        : RedCircle;

    return (
      <motion.div
        key={key}
        initial={false}
        animate={{
          x: getX(index),
          y: type === "diamond" ? [0, 20, 20, 0] : [0, -50, -50, 0],
        }}
        transition={{ duration: 0.9, ease: "easeInOut" }}
        style={{
          width: ballSize,
          height: ballSize,
          position: "absolute",
        }}
      >
        <IconWrapper>
          <Icon />
        </IconWrapper>
      </motion.div>
    );
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "white",
      }}
    >
      <div style={{ position: "relative", width: spacing * 3, height: ballSize * 2 }}>
        <AnimatePresence>
          {renderBall("blue", positions.blue, "square")}
          {renderBall("gray", positions.gray, "diamond")}
          {renderBall("purple", positions.purple, "circle")}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LoaderAnimation;