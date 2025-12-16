/** @type {import('tailwindcss').Config} */
import { mtConfig } from "@material-tailwind/react";

export default {
    darkMode: 'class',
    content: [
        "./resources/**/*.blade.php",
        "./resources/**/*.{js,ts,jsx,tsx}",
        "./resources/**/*.vue",
        "./node_modules/@material-tailwind/react/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Quicksand', 'sans-serif'],
                mono: ['Space Mono', 'monospace'],
                neo: ['Public Sans', 'sans-serif']
            },
            colors: {
                neo: {
                    pinkish: '#FFDFD6',
                    blue: '#E3F2FD',
                    lime: '#A3E635',
                    yellow: '#FEF08A',
                    dark: '#18181b',
                }
            },
            boxShadow: {
                'neo': '5px 5px 0px 0px rgba(0,0,0,1)',
                'neo-sm': '3px 3px 0px 0px rgba(0,0,0,1)',
                'neo-hover': '0px 0px 0px 0px rgba(0,0,0,1)',
            }
        }
    },
    plugins: [mtConfig],
};
