import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // 明色系 · 高级 · 克制 · 温馨
        canvas: '#FAF8F6', // 暖白主底
        ink: '#2A2422', // 深炭文字
        inkSoft: '#6B635E', // 次级文字
        // 品牌赤红系
        brand: {
          DEFAULT: 'rgb(215, 75, 74)', // 主色 #D74B4A
          50: '#FDF2F2',
          100: '#FBE3E3',
          200: '#F6C5C4',
          300: '#EFA1A0',
          400: '#E88B8A',
          500: 'rgb(215, 75, 74)',
          600: '#C24140',
          700: '#9F3534',
          800: '#7C2A2A',
        },
        warm: 'rgb(240, 122, 118)', // 辅助暖色 #F07A76
        line: '#E9E9E9', // 分隔/描边 rgb(233,233,233)
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          '"Source Han Sans CN"',
          'sans-serif',
        ],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      maxWidth: {
        shell: '1700px', // 版心
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      animation: {
        'fade-up': 'fadeUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'fade-in': 'fadeIn 0.8s ease forwards',
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
      },
      boxShadow: {
        soft: '0 1px 3px rgba(42,36,34,0.04), 0 8px 30px rgba(42,36,34,0.06)',
        card: '0 2px 8px rgba(42,36,34,0.05), 0 20px 48px rgba(42,36,34,0.08)',
        lift: '0 8px 24px rgba(215,75,74,0.12), 0 24px 60px rgba(42,36,34,0.12)',
      },
    },
  },
  plugins: [],
} satisfies Config
