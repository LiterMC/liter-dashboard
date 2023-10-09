import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'

const router = createRouter({
  history: createWebHashHistory(), // since the page may under some reverse proxies, we just use the hash for easy configure
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    }
  ]
})

export default router
