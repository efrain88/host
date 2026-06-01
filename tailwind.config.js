const colors = require('tailwindcss/colors');

const gray = {
    50: '#f8f9fa',
    100: '#f1f3f5',
    200: '#e9ecef',
    300: '#dee2e6',
    400: '#ced4da',
    500: '#adb5bd',
    600: '#151515',
    700: '#0a0a0a',
    800: '#050505',
    900: '#000000',
};

module.exports = {
    content: [
        './resources/scripts/**/*.{js,ts,tsx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                header: ['"Outfit"', '"Inter"', 'system-ui', 'sans-serif'],
                sans: ['"Outfit"', '"Inter"', 'system-ui', 'sans-serif'],
            },
            colors: {
                black: '#050505',
                primary: colors.violet,
                gray: gray,
                neutral: gray,
                cyan: colors.cyan,
            },
            fontSize: {
                '2xs': '0.625rem',
            },
            transitionDuration: {
                250: '250ms',
            },
            borderColor: theme => ({
                default: theme('colors.neutral.400', 'currentColor'),
            }),
        },
    },
    plugins: [
        require('@tailwindcss/line-clamp'),
        require('@tailwindcss/forms')({
            strategy: 'class',
        }),
    ]
};
