import { createRouter, createWebHistory } from 'vue-router'
import { loadTenant } from './stores/tenantStore'
import CustomerReservationDetailPage from './pages/CustomerReservationDetailPage.vue'
import CustomerReservationsPage from './pages/CustomerReservationsPage.vue'
import CustomerProfilePage from './pages/CustomerProfilePage.vue'
import ForgotPasswordPage from './pages/ForgotPasswordPage.vue'
import FilterPage from './pages/FilterPage.vue'
import HomePage from './pages/HomePage.vue'
import LoginPage from './pages/LoginPage.vue'
import NotFoundPage from './pages/NotFoundPage.vue'
import ReservationPage from './pages/ReservationPage.vue'
import ResetPasswordPage from './pages/ResetPasswordPage.vue'
import { tenantState } from './stores/tenantStore'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomePage },
    { path: '/buscar', name: 'filter', component: FilterPage },
    { path: '/login', name: 'login', component: LoginPage },
    { path: '/esqueci-senha', name: 'forgot-password', component: ForgotPasswordPage },
    { path: '/resetar-senha', name: 'reset-password', component: ResetPasswordPage },
    { path: '/minhas-reservas', name: 'customer-reservations', component: CustomerReservationsPage },
    { path: '/minhas-reservas/:id', name: 'reservation-detail', component: CustomerReservationDetailPage },
    { path: '/meu-perfil', name: 'customer-profile', component: CustomerProfilePage },
    {
      path: '/reserva/:id',
      name: 'reservation',
      component: ReservationPage,
    },
    { path: '/404', name: 'not-found', component: NotFoundPage, meta: { hideLayout: true } },
    { path: '/:pathMatch(.*)*', name: 'route-not-found', component: NotFoundPage, meta: { hideLayout: true } },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach(async (to) => {
  await loadTenant()

  if (tenantState.notFound && to.name !== 'not-found') {
    return { name: 'not-found', replace: true }
  }

  return true
})

export default router
