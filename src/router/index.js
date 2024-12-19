import { useAuthStore } from '@/api/authStores';
import AppLayout from '@/layout/AppLayout.vue';
import { createRouter, createWebHistory } from 'vue-router';

const routes = [
    {
        path: '/',
        redirect: '/auth/login' // Redirige a la ruta del login
    },
    {
        path: '/auth/login',
        name: 'login',
        component: () => import('@/views/pages/auth/Login.vue') // Ruta al login
    },
    {
        path: '/',
        component: AppLayout,
        meta: { requiresAuth: true },
        children: [
            {
                path: 'dashboard',
                name: 'dashboard',
                component: () => import('@/views/Dashboard.vue')
            }
        ]
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();
    authStore.loadSession(); // Cargar sesión si existe

    if (to.meta.requiresAuth && !authStore.user) {
        next({ name: 'login' }); // Redirigir al login si no está autenticado
    } else {
        next();
    }
});

export default router;
