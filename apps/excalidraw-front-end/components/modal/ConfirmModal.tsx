import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@repo/ui/components/base/dialog";
import React from "react";

interface ConfirmModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onConfirm: () => void;
  theme: "light" | "dark";
}

export const ConfirmModal = ({
  open,
  setOpen,
  onConfirm,
  theme
}: ConfirmModalProps) => {
  const handleCancel = () => setOpen(false);

  // Button styles
  const confirmBtnStyles =
    theme === "dark"
      ? "bg-[#ffa8a5] text-black cursor-pointer"
      : "bg-[#db6965] text-white cursor-pointer";
  const cancelBtnStyles =
    theme === "dark"
      ? "bg-[#232329] text-[#c1c1c6] border-none cursor-pointer"
      : "bg-white text-black border border-gray-300 cursor-pointer";
  const modalBg = theme === "dark" ? "bg-[#232329]" : "bg-[#ffffff]";

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogContent
        className={`sm:max-w-[470px] min-w-[370px] py-10 px-8 rounded-2xl ${modalBg} flex flex-col items-center border-none`}
      >
        <DialogHeader className="space-y-4 w-full text-center">
          <DialogTitle className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-black"}`}>
            Clear Canvas
          </DialogTitle>
          <DialogDescription className={`text-base ${theme === "dark" ? "text-[#ededed]" : "text-gray-800"}`}>
            Do you really want to clear the canvas? This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-row gap-7 justify-center w-full mt-9">
          <button
            className={`flex-1 py-4 rounded-xl text-lg font-semibold transition-colors duration-150 ${cancelBtnStyles}`}
            style={{ minWidth: 140, minHeight: 58 }}
            onClick={handleCancel}
            type="button"
          >
            No
          </button>
          <button
            className={`flex-1 py-4 rounded-xl text-lg font-semibold flex items-center gap-2 justify-center transition-colors duration-150 ${confirmBtnStyles}`}
            style={{ minWidth: 140, minHeight: 58 }}
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
            type="button"
          >
            Yes
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
