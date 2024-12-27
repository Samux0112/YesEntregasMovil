import { computed, reactive, watch } from 'vue';
import Swal from 'sweetalert2';

const layoutConfig = reactive({
    preset: 'Aura',
    primary: 'emerald',
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

const getSwalClass = () => {
    return layoutConfig.darkTheme ? 'swal-dark' : 'swal-light';
};

// Configuración de SweetAlert2
const defaultSwal = Swal.mixin({
    customClass: {
        popup: getSwalClass(),
    },
    didOpen: () => {
        const classToAdd = getSwalClass();
        const classToRemove = layoutConfig.darkTheme ? 'swal-light' : 'swal-dark';
        Swal.getPopup().classList.add(classToAdd);
        Swal.getPopup().classList.remove(classToRemove);
    }
});

watch(() => layoutConfig.darkTheme, () => {
    Swal.update({
        customClass: {
            popup: getSwalClass(),
        }
    });
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
        document.documentElement.classList.toggle('app-dark');
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
        defaultSwal // Exporta defaultSwal para usarlo en otros componentes
    };
}