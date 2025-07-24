import { Sparkles, Heart, Star, Zap, Pencil, Users } from "lucide-react";

const floatingDoodles = [
  { icon: Sparkles, color: "#ff6b6b", delay: 0, x: 10, y: 20 },
  { icon: Heart, color: "#4ecdc4", delay: 1, x: 80, y: 10 },
  { icon: Star, color: "#45b7d1", delay: 2, x: 5, y: 50 },
  { icon: Zap, color: "#96ceb4", delay: 0.5, x: 85, y: 70 },
  { icon: Pencil, color: "#feca57", delay: 1.5, x: 25, y: 85 },
  { icon: Users, color: "#ff9ff3", delay: 2.5, x: 70, y: 40 },
  { icon: Heart, color: "#f78fb3", delay: 3, x: 40, y: 30 },
  { icon: Heart, color: "#f78fb3", delay: 3, x: 4, y: 12 },
  { icon: Star, color: "#70a1ff", delay: 1.2, x: 55, y: 80 },
  { icon: Sparkles, color: "#ff6b81", delay: 2.3, x: 5, y: 75 },
  { icon: Zap, color: "#ffdd59", delay: 1.8, x: 95, y: 30 },
  { icon: Pencil, color: "#48dbfb", delay: 2.7, x: 60, y: 5 },
  { icon: Users, color: "#1dd1a1", delay: 0.7, x: 45, y: 55 },
];

const FloatingDoodles: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {floatingDoodles.map((doodle, index) => (
        <div
          key={index}
          className="absolute animate-bounce"
          style={{
            left: `${doodle.x}%`,
            top: `${doodle.y}%`,
            animationDelay: `${doodle.delay}s`,
            animationDuration: `${3 + index * 0.5}s`,
          }}
        >
          <doodle.icon
            size={24 + index * 4}
            color={doodle.color}
            className="opacity-60 hover:opacity-80 transition-opacity duration-300"
          />
        </div>
      ))}
    </div>
  );
};

export default FloatingDoodles;