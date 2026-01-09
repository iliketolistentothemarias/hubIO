/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './contexts/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
  	extend: {
          colors: {
            background: 'hsl(var(--background))',
            foreground: 'hsl(var(--foreground))',
            card: {
              DEFAULT: 'hsl(var(--card))',
              foreground: 'hsl(var(--card-foreground))',
            },
            popover: {
              DEFAULT: 'hsl(var(--popover))',
              foreground: 'hsl(var(--popover-foreground))',
            },
            primary: {
  				'50': '#fef9f0',
  				'100': '#fdf2e0',
  				'200': '#fae4c0',
  				'300': '#f6d6a0',
  				'400': '#f2c880',
  				'500': '#D4A574',
  				'600': '#8B6F47',
  				'700': '#7A5F3A',
  				'800': '#6A4F2D',
  				'900': '#5A3F20',
  				DEFAULT: '#8B6F47',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				'50': '#fef9f0',
  				'100': '#fdf2e0',
  				'200': '#fae4c0',
  				'300': '#f6d6a0',
  				'400': '#f2c880',
  				'500': '#D4A574',
  				'600': '#C49A6A',
  				'700': '#B48A5A',
  				'800': '#A47A4A',
  				'900': '#946A3A',
  				DEFAULT: '#D4A574',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
		fontFamily: {
			sans: [
				'var(--font-sans)',
				'Poppins',
				'system-ui',
				'sans-serif'
			],
			display: [
				'var(--font-serif)',
				'Merriweather',
				'Georgia',
				'serif'
			]
		},
  		animation: {
  			'fade-in': 'fadeIn 0.5s ease-in',
  			'slide-up': 'slideUp 0.5s ease-out',
  			'slide-in': 'slideIn 0.6s ease-out',
  			'bounce-slow': 'bounce 3s infinite',
  			'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  			'spin-slow': 'spin 8s linear infinite',
  			float: 'float 6s ease-in-out infinite',
  			glow: 'glow 2s ease-in-out infinite alternate',
  			shimmer: 'shimmer 2s linear infinite',
  			'ios-bounce': 'iosBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  			'ios-scale': 'iosScale 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  			'ios-fade': 'iosFade 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  			'ios-slide': 'iosSlide 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
  			spring: 'spring 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
  		},
  		keyframes: {
  			fadeIn: {
  				'0%': {
  					opacity: '0'
  				},
  				'100%': {
  					opacity: '1'
  				}
  			},
  			slideUp: {
  				'0%': {
  					transform: 'translateY(20px)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'translateY(0)',
  					opacity: '1'
  				}
  			},
  			slideIn: {
  				'0%': {
  					transform: 'translateX(-20px)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'translateX(0)',
  					opacity: '1'
  				}
  			},
  			float: {
  				'0%, 100%': {
  					transform: 'translateY(0px)'
  				},
  				'50%': {
  					transform: 'translateY(-20px)'
  				}
  			},
  			glow: {
  				'0%': {
  					boxShadow: '0 0 5px rgba(2, 132, 199, 0.5)'
  				},
  				'100%': {
  					boxShadow: '0 0 20px rgba(2, 132, 199, 0.8), 0 0 30px rgba(2, 132, 199, 0.6)'
  				}
  			},
  			shimmer: {
  				'0%': {
  					backgroundPosition: '-1000px 0'
  				},
  				'100%': {
  					backgroundPosition: '1000px 0'
  				}
  			},
  			iosBounce: {
  				'0%': {
  					transform: 'scale(0.8)',
  					opacity: '0'
  				},
  				'50%': {
  					transform: 'scale(1.05)'
  				},
  				'100%': {
  					transform: 'scale(1)',
  					opacity: '1'
  				}
  			},
  			iosScale: {
  				'0%': {
  					transform: 'scale(1)'
  				},
  				'50%': {
  					transform: 'scale(0.95)'
  				},
  				'100%': {
  					transform: 'scale(1)'
  				}
  			},
  			iosFade: {
  				'0%': {
  					opacity: '0',
  					transform: 'translateY(10px)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			iosSlide: {
  				'0%': {
  					transform: 'translateX(-100%)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'translateX(0)',
  					opacity: '1'
  				}
  			},
  			spring: {
  				'0%': {
  					transform: 'scale(0.9)',
  					opacity: '0'
  				},
  				'50%': {
  					transform: 'scale(1.02)'
  				},
  				'100%': {
  					transform: 'scale(1)',
  					opacity: '1'
  				}
  			}
  		},
  		backdropBlur: {
  			xs: '2px',
  			ios: '20px',
  			'ios-lg': '40px'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
