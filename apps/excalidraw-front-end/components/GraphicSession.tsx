import { Palette, Sparkles, Star, Zap } from "lucide-react";

interface GraphicSectionProps {
  isDark: boolean;
}

const GraphicSection: React.FC<GraphicSectionProps> = ({ isDark }) => {
  return (
    <div className="relative flex items-center justify-center">
      <div className="relative">
        <div
          className="w-96 h-96 rounded-full border-4 border-dashed animate-pulse"
          style={{
            borderColor: isDark ? "#a8a5ff" : "#6965db",
            animationDuration: "3s",
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <Palette
                size={120}
                color={isDark ? "#a8a5ff" : "#6965db"}
                className="animate-bounce"
                style={{ animationDuration: "2s" }}
              />
              <div
                className="absolute -top-8 -right-8 animate-spin"
                style={{ animationDuration: "8s" }}
              >
                <Sparkles size={32} color="#ff6b6b" />
              </div>
              <div
                className="absolute -bottom-8 -left-8 animate-spin"
                style={{ animationDuration: "6s" }}
              >
                <Star size={28} color="#4ecdc4" />
              </div>
              <div
                className="absolute top-0 -left-12 animate-bounce"
                style={{ animationDelay: "1s" }}
              >
                <Zap size={24} color="#feca57" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraphicSection;