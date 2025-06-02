import { Button } from "@repo/ui/button";
export function ShareButton() {
  return (
    <Button
      variant="primary" // or another available variant like "outline", "ghost"
      size="sm"          // or "md", "lg" based on what's available
      className="bg-[#232329] text-white px-4 py-2 rounded"
    >
      Share
    </Button>
  );
}