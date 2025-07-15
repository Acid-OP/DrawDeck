"use client";
import { useState } from "react";
import {
  Palette,
  Sparkles,
  Zap,
  Users,
  Pencil,
  Star,
  Heart,
  ArrowRight,
} from "lucide-react";
import { useRouter } from "next/navigation";

const ExcalidrawSignup = () => {
  const [isDark, setIsDark] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
  };

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

  return (
    <div
      className={`min-h-screen overflow-hidden transition-all duration-500 ${
        isDark ? "bg-[#232329]" : "bg-[#fff0c9]"
      }`}
    >
      <button
        onClick={() => setIsDark(!isDark)}
        className="fixed top-4 right-4 z-50 p-2 rounded-full bg-yellow-300 hover:bg-yellow-400 transition-all duration-300 cursor-pointer shadow"
      >
        <span className="text-2xl">{isDark ? "🌙" : "☀"}</span>
      </button>

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

      <div className="pt-8 text-center">
        <h1
          className="text-6xl font-bold mb-2 animate-pulse"
          style={{
            color: isDark ? "#e2dfff" : "#1a0265",
            textShadow: "2px 2px 4px rgba(0,0,0,0.1)",
            fontFamily: "Comic Sans MS, cursive",
          }}
        >
          Excalidraw
        </h1>
        <p
          className="text-xl opacity-80"
          style={{ color: isDark ? "#ced4da" : "#363c41" }}
        >
          Where ideas come to life
        </p>
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-between mt-12 max-w-screen-xl mx-auto">
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

        <div
          className="w-full max-w-md p-8 rounded-3xl shadow-2xl backdrop-blur-sm border-[3px] border-solid"
          style={{
            backgroundColor: isDark
              ? "rgba(255,255,255,0.1)"
              : "rgba(255,255,255,0.8)",
            borderColor: isDark ? "#a8a5ff" : "#6965db",
          }}
        >
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="animate-bounce">
                <Sparkles size={48} color={isDark ? "#a8a5ff" : "#6965db"} />
              </div>
            </div>
            <h2
              className="text-2xl font-bold mb-1"
              style={{
                color: isDark ? "#ced4da" : "#363c41",
                fontFamily: "Comic Sans MS, cursive",
              }}
            >
              Hi there!
            </h2>
            <p
              className="text-md pt-2 opacity-80"
              style={{ color: isDark ? "#ced4da" : "#363c41" }}
            >
              Join the creative community
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {["name", "email", "password"].map((field) => (
              <div key={field}>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: isDark ? "#ced4da" : "#363c41" }}
                >
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <input
                  type={field === "password" ? "password" : field}
                  name={field}
                  value={formData[field as keyof typeof formData]}
                  onChange={handleInputChange}
                  placeholder={`Enter your ${field}`}
                  className="w-full px-4 py-3 rounded-xl border-2 border-solid transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-0"
                  style={{
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(255,255,255,0.8)",
                    borderColor: isDark ? "#a8a5ff" : "#6965db",
                    color: isDark ? "#ced4da" : "#000000",
                    boxShadow: "none",
                    outline: "none",
                    WebkitBoxShadow: "none",
                  }}
                />
              </div>
            ))}

            <button
              type="submit"
              className="w-full py-4 px-6 rounded-xl font-bold text-white border-2 border-solid transition-colors duration-300 cursor-pointer flex items-center justify-center gap-2"
              style={{
                backgroundColor: isDark ? "#a8a5ff" : "#6965db",
                borderColor: isDark ? "#e2dfff" : "#1a0265",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  isDark ? "#8b84f8" : "#514bc7";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  isDark ? "#a8a5ff" : "#6965db";
              }}
            >
              Start Creating
              <ArrowRight
                size={20}
                className="transition-transform duration-300 translate-y-[1px]"
              />
            </button>
          </form>

          <div className="mt-6 text-center">
            <p
              className="text-sm font-medium"
              style={{ color: isDark ? "#ced4da" : "#363c41" }}
            >
              Already have an account?{" "}
              <button
                className="underline cursor-pointer hover:no-underline transition-all duration-300"
                style={{ color: isDark ? "#a8a5ff" : "#6965db" }}
                onClick={() => router.push("/signin")}
              >
                Sign in instead
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcalidrawSignup;
