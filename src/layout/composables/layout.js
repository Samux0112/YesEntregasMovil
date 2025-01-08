import Swal from 'sweetalert2';
import { computed, onMounted, reactive, watch } from 'vue';

const layoutConfig = reactive({
    preset: 'Aura',
    primary: 'orange',
    surface: null,
    darkTheme: false,
    menuMode: 'static',
});

const layoutState = reactive({
    staticMenuDesktopInactive: false,
    overlayMenuActive: false,
    profileSidebarVisible: false,
    configSidebarVisible: false,
    staticMenuMobileActive: false,
    menuHoverActive: false,
    activeMenuItem: null,
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

    // Function to show SweetAlert2 alert adapted to the current theme
    const showAlert = (titleOrOptions, text = '', icon = '', customOptions = {}) => {
        const isDark = layoutConfig.darkTheme;
        const primaryColor = getPrimary.value;
        const backgroundColor = isDark ? "#09090b" : "#ffffff";
        const textColor = isDark ? "#ffffff" : "#000000";

        let options = {};

        if (typeof titleOrOptions === 'object') {
            options = {
                background: backgroundColor,
                color: textColor,
                confirmButtonColor: primaryColor,
                ...titleOrOptions,
            };
        } else {
            options = {
                title: titleOrOptions,
                text,
                icon,
                background: backgroundColor,
                color: textColor,
                confirmButtonColor: primaryColor,
                ...customOptions,
            };
        }

        return Swal.fire(options);
    };

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
        showAlert,
    };
}