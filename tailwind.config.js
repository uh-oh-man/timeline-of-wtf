/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      boxShadow: {
        "alarm-glow": "0 0 38px rgba(244, 63, 94, 0.24)",
        "cyan-glow": "0 0 28px rgba(34, 211, 238, 0.18)",
      },
      keyframes: {
        "slow-float": {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "50%": { transform: "translate3d(22px, -18px, 0) scale(1.06)" },
        },
        "slow-float-alt": {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "50%": { transform: "translate3d(-28px, 18px, 0) scale(1.08)" },
        },
      },
      animation: {
        "slow-float": "slow-float 16s ease-in-out infinite",
        "slow-float-alt": "slow-float-alt 19s ease-in-out infinite",
      },
      opacity: {
        12: "0.12",
        14: "0.14",
        15: "0.15",
        16: "0.16",
        18: "0.18",
        24: "0.24",
        35: "0.35",
        45: "0.45",
        65: "0.65",
        78: "0.78",
        85: "0.85",
      },
    },
  },
  plugins: [],
};
