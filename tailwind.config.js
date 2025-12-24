/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./App.tsx",
        "./index.tsx",
        "./*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'Poppins', 'sans-serif'],
            },
            colors: {
                background: {
                    DEFAULT: '#f8f7fc',
                    light: '#fdfcfe',
                    card: '#FFFFFF',
                },
                primary: {
                    DEFAULT: '#6366F1', // Indigo
                    light: '#818CF8',
                    dark: '#4F46E5',
                },
                secondary: '#8B5CF6', // Purple
                tertiary: '#3B82F6', // Blue
                success: '#10B981', // Green
                warning: '#F59E0B', // Orange
                danger: '#EF4444', // Red
                text: {
                    DEFAULT: '#1F2937',
                    light: '#6B7280',
                    muted: '#9CA3AF',
                },
            },
            boxShadow: {
                'soft': '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
                'medium': '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.06)',
                'card': '0 1px 3px rgba(0, 0, 0, 0.08)',
            },
            borderRadius: {
                'xl': '0.875rem',
                '2xl': '1rem',
                '3xl': '1.25rem',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                }
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out forwards',
                'slide-up': 'slideUp 0.5s ease-out forwards',
                'scale-in': 'scaleIn 0.3s ease-out forwards',
            }
        }
    },
    plugins: [],
}
