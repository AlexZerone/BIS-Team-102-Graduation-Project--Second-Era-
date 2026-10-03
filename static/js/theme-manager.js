/**
 * Theme Manager - Enhanced Dark Mode Support
 * Version: 1.0.0
 * Provides comprehensive theme switching functionality
 */

class ThemeManager {
    constructor() {
        this.init();
    }

    init() {
        // Theme-related elements
        this.htmlElement = document.documentElement;
        this.themeSwitcher = document.getElementById('themeSwitcher');
        this.themeStylesheets = document.querySelectorAll('link[data-theme]');
        
        // Initialize theme
        this.loadTheme();
        this.setupEventListeners();
        this.setupSystemThemeListener();
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        const systemTheme = this.getSystemTheme();
        const initialTheme = savedTheme || systemTheme;
        
        this.setTheme(initialTheme, false);
    }

    getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    setTheme(theme, animate = true) {
        // Add transition if requested
        if (animate) {
            this.addTransition();
        }

        // Set theme attribute
        this.htmlElement.setAttribute('data-bs-theme', theme);
        
        // Update UI elements
        this.updateThemeIcon(theme);
        this.updateMetaThemeColor(theme);
        this.updateFormElements(theme);
        
        // Dispatch theme change event
        this.dispatchThemeChangeEvent(theme);
        
        // Store preference
        localStorage.setItem('theme', theme);
        
        // Log theme change for analytics
        this.logThemeChange(theme);
    }

    toggleTheme() {
        const currentTheme = this.htmlElement.getAttribute('data-bs-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme, true);
    }

    updateThemeIcon(theme) {
        if (!this.themeSwitcher) return;
        
        const icon = this.themeSwitcher.querySelector('i');
        if (!icon) return;

        // Update icon with smooth transition
        icon.style.transform = 'scale(0.8)';
        
        setTimeout(() => {
            if (theme === 'dark') {
                icon.className = 'fas fa-sun';
                this.themeSwitcher.title = 'Switch to light mode';
                this.themeSwitcher.setAttribute('aria-label', 'Switch to light mode');
            } else {
                icon.className = 'fas fa-moon';
                this.themeSwitcher.title = 'Switch to dark mode';
                this.themeSwitcher.setAttribute('aria-label', 'Switch to dark mode');
            }
            icon.style.transform = 'scale(1)';
        }, 150);
    }

    updateMetaThemeColor(theme) {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }

        const colors = {
            light: '#223947',
            dark: '#1a202c'
        };

        metaThemeColor.content = colors[theme];
    }

    updateFormElements(theme) {
        // Update form elements that might need specific handling
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.setAttribute('data-theme', theme);
        });

        // Update any custom components
        const customComponents = document.querySelectorAll('[data-theme-aware]');
        customComponents.forEach(component => {
            component.setAttribute('data-current-theme', theme);
        });
    }

    addTransition() {
        const transitionClass = 'theme-transition';
        document.body.classList.add(transitionClass);
        
        // Remove transition class after animation
        setTimeout(() => {
            document.body.classList.remove(transitionClass);
        }, 300);
    }

    setupEventListeners() {
        // Theme switcher click
        if (this.themeSwitcher) {
            this.themeSwitcher.addEventListener('click', () => {
                this.toggleTheme();
            });

            // Keyboard accessibility
            this.themeSwitcher.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleTheme();
                }
            });
        }

        // Keyboard shortcut (Ctrl/Cmd + Shift + T)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                this.toggleTheme();
            }
        });
    }

    setupSystemThemeListener() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        mediaQuery.addEventListener('change', (e) => {
            // Only update if user hasn't set a preference
            if (!localStorage.getItem('theme')) {
                this.setTheme(e.matches ? 'dark' : 'light', true);
            }
        });
    }

    dispatchThemeChangeEvent(theme) {
        const event = new CustomEvent('themeChanged', {
            detail: {
                theme: theme,
                timestamp: new Date().toISOString(),
                source: 'themeManager'
            }
        });
        
        window.dispatchEvent(event);
    }

    logThemeChange(theme) {
        // For analytics or debugging
        if (window.console) {
            console.log(`Theme changed to: ${theme}`);
        }

        // Send to analytics if available
        if (typeof gtag !== 'undefined') {
            gtag('event', 'theme_change', {
                'theme': theme,
                'event_category': 'user_preference'
            });
        }
    }

    // Public API methods
    getCurrentTheme() {
        return this.htmlElement.getAttribute('data-bs-theme');
    }

    isSystemTheme() {
        return !localStorage.getItem('theme');
    }

    resetToSystemTheme() {
        localStorage.removeItem('theme');
        this.setTheme(this.getSystemTheme(), true);
    }

    // Preload theme-specific resources
    preloadThemeResources(theme) {
        const themeResources = {
            dark: [
                // Add any dark-theme specific resources
            ],
            light: [
                // Add any light-theme specific resources
            ]
        };

        const resources = themeResources[theme] || [];
        resources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource.href;
            link.as = resource.as;
            document.head.appendChild(link);
        });
    }
}

// CSS for smooth transitions
const themeTransitionCSS = `
.theme-transition,
.theme-transition *,
.theme-transition *:before,
.theme-transition *:after {
    transition: all 0.3s ease !important;
    transition-delay: 0 !important;
}
`;

// Inject transition CSS
const style = document.createElement('style');
style.textContent = themeTransitionCSS;
document.head.appendChild(style);

// Initialize theme manager when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.themeManager = new ThemeManager();
    });
} else {
    window.themeManager = new ThemeManager();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}
