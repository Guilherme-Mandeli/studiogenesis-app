import defaultTheme from 'tailwindcss/defaultTheme';

export default {
    content: [
        './components/**/*.{vue,js,ts}',
        './layouts/**/*.vue',
        './pages/**/*.vue',
        './plugins/**/*.{js,ts}',
        './app.vue',
        './nuxt.config.{js,ts}'
    ],
    theme: {
        extend: {
            colors: {
                // Material 3 inspired colors
                primary: {
                    50: '#eff6fc',
                    100: '#dbebf9',
                    200: '#bfdaf2',
                    300: '#93c0ea',
                    400: '#62a3e0',
                    500: '#518bbe',
                    600: '#336ea0',
                    700: '#2a5882',
                    800: '#264a6c',
                    900: '#233e59',
                    DEFAULT: '#518BBE',
                },
                onPrimary: '#FFFFFF',
                primaryContainer: '#DCE4F2',
                onPrimaryContainer: '#001E37',

                secondary: '#7BB3E0',
                onSecondary: '#FFFFFF',
                secondaryContainer: '#DCE4F2',
                onSecondaryContainer: '#001E37',

                tertiary: '#A6C5E8',
                onTertiary: '#1A1A1A',

                background: '#FFFFFF',
                surface: '#F5F5F5',
                onSurface: '#1A1A1A',

                error: '#B00020',
                onError: '#FFFFFF',
                errorContainer: '#FCD8DC',
                onErrorContainer: '#410005'
            },
            fontFamily: {
                sans: ['Roboto', ...defaultTheme.fontFamily.sans],
            },
            fontSize: {
                headline_large: ['32px', { lineHeight: '40px', fontWeight: '700' }],
                headline_medium: ['28px', { lineHeight: '36px', fontWeight: '600' }],
                headline_small: ['24px', { lineHeight: '32px', fontWeight: '600' }],
                body_large: ['16px', { lineHeight: '24px', fontWeight: '400' }],
                body_medium: ['14px', { lineHeight: '20px', fontWeight: '400' }],
                label: ['12px', { lineHeight: '16px', fontWeight: '500' }]
            },
            borderRadius: {
                sm: '4px',   // buttons, inputs
                md: '8px',   // cards, containers
                lg: '12px',  // large surfaces
            },
            boxShadow: {
                sm: '0 1px 2px rgba(0,0,0,0.05)',
                md: '0 2px 4px rgba(0,0,0,0.08)',
                lg: '0 4px 8px rgba(0,0,0,0.1)',
            },
            spacing: {
                button_h: '44px',
                button_px: '16px',
                card_padding: '20px',
            },
        }
    },
    plugins: [],
};
