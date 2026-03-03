/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#428bf0',
                'background-light': '#f0f7ff',
                'background-dark': '#0d1726',
            },
            backdropBlur: {
                xs: '2px',
            },
            animation: {
                'spin-slow': 'spin 8s linear infinite',
            }
        },
    },
    plugins: [],
}
