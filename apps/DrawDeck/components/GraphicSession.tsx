import { Palette, Sparkles, Star, Zap } from "lucide-react";

interface GraphicSectionProps {
  isDark: boolean;
}

const GraphicSection: React.FC<GraphicSectionProps> = ({ isDark }) => {
  return (
    <div className="relative flex items-center justify-center">
      <div className="relative">
        <div
          className="w-80 h-80 rounded-full border-4 border-dashed animate-pulse"
          style={{
            borderColor: isDark ? "#a8a5ff" : "#6965db",
            animationDuration: "3s",
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <Palette
                size={100} // was 120
                color={isDark ? "#a8a5ff" : "#6965db"}
                className="animate-bounce"
                style={{ animationDuration: "2s" }}
              />
              <div
                className="absolute -top-7 -right-7 animate-spin"
                style={{ animationDuration: "8s" }}
              >
                <Sparkles size={28} color="#ff6b6b" /> {/* was 32 */}
              </div>
              <div
                className="absolute -bottom-7 -left-7 animate-spin"
                style={{ animationDuration: "6s" }}
              >
                <Star size={24} color="#4ecdc4" /> {/* was 28 */}
              </div>
              <div
                className="absolute top-0 -left-10 animate-bounce"
                style={{ animationDelay: "1s" }}
              >
                <Zap size={20} color="#feca57" /> {/* was 24 */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraphicSection;