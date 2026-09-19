/** @type {import('tailwindcss').Config} */
export default {
  // Files Tailwind should scan for class names
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],

  theme: {
    extend: {
      // You can safely extend your design system here later

      colors: {
        primary: "#0f172a", // slate-900 (LeadFlow dark UI base)
        accent: "#3b82f6",  // blue-500 (AI / highlights)
        success: "#10b981", // green-500 (hot leads / success)
        warning: "#f59e0b", // amber-500 (follow-ups)
        danger: "#ef4444",  // red-500 (hot urgency)
      },

      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.08)",
      },

      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },

  plugins: [],
};