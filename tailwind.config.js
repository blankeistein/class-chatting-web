/** @type {import('tailwindcss').Config} */
import { mtConfig } from "@material-tailwind/react";

export default {
    content: [
        "./resources/**/*.blade.php",
        "./resources/**/*.js",
        "./resources/**/*.jsx",
        "./resources/**/*.vue",
        "./node_modules/@material-tailwind/react/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ["Nunito", "sans"],
                display: ["Nunito", "sans-serif"],
            },
        },
    },
    plugins: [mtConfig],
};
