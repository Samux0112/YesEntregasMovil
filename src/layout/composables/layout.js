import { computed, reactive, onMounted, watch } from 'vue';

const layoutConfig = reactive({
    preset: 'Aura',
    primary: 'orange',
    surface: null,
    darkTheme: false,
    menuMode: 'static'
});

const layoutState = reactive({
    staticMenuDesktopInactive: false,
    overlayMenuActive: false,
    profileSidebarVisible: false,
    configSidebarVisible: false,
    staticMenuMobileActive: false,
    menuHoverActive: false,
    activeMenuItem: null
});

export function useLayout() {
    const setActiveMenuItem = (item) => {
        layoutState.activeMenuItem = item.value || item;
    };

    const toggleDarkMode = () => {
        if (!document.startViewTransition) {
            executeDarkModeToggle();
            return;
        }

        document.startViewTransition(() => executeDarkModeToggle());
    };

    const executeDarkModeToggle = () => {
        layoutConfig.darkTheme = !layoutConfig.darkTheme;
        document.documentElement.classList.toggle('app-dark', layoutConfig.darkTheme);
    };

    const toggleMenu = () => {
        if (layoutConfig.menuMode === 'overlay') {
            layoutState.overlayMenuActive = !layoutState.overlayMenuActive;
        }

        if (window.innerWidth > 991) {
            layoutState.staticMenuDesktopInactive = !layoutState.staticMenuDesktopInactive;
        } else {
            layoutState.staticMenuMobileActive = !layoutState.staticMenuMobileActive;
        }
    };

    const isSidebarActive = computed(() => layoutState.overlayMenuActive || layoutState.staticMenuMobileActive);

    const isDarkTheme = computed(() => layoutConfig.darkTheme);

    const getPrimary = computed(() => layoutConfig.primary);

    const getSurface = computed(() => layoutConfig.surface);

    // Detect system dark mode preference and update layoutConfig accordingly
    const updateDarkModeFromSystem = () => {
        const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        layoutConfig.darkTheme = isSystemDark;
        document.documentElement.classList.toggle('app-dark', isSystemDark);
    };

    onMounted(() => {
        updateDarkModeFromSystem();
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateDarkModeFromSystem);
    });

    watch(() => layoutConfig.darkTheme, (newVal) => {
        document.documentElement.classList.toggle('app-dark', newVal);
    });

    return {
        layoutConfig,
        layoutState,
        toggleMenu,
        isSidebarActive,
        isDarkTheme,
        getPrimary,
        getSurface,
        setActiveMenuItem,
        toggleDarkMode,
    };
}