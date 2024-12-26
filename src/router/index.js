import { useAuthStore } from '@/api-plugins/authStores';
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
            },
            {
                path: 'clientes', // Nueva ruta para la vista de entregas
                name: 'clientes',
                component: () => import('@/views/ClientesView.vue'), // Ruta a la vista de entregas
                meta: { requiresAuth: true }
            },
            {
                path: 'entregas', // Ruta con un parámetro dinámico pero funciona
                name: 'entregas',
                component: () => import('@/views/EntregasView.vue'),
                meta: { requiresAuth: true } // Componente para la pantalla Entregas
            },
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
