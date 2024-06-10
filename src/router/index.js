import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AboutView from '../views/AboutView.vue'
import Login from '../views/Login.vue'
import Dashboard from '../views/Dashboard.vue'
import Register from '../views/Register.vue'
import Devices from '../views/Devices.vue'
import Profile from '../views/components/Profile.vue'
import DeviceDetails from '../views/DeviceDetails.vue'

const isAuthenticated = () => {
  return !!localStorage.getItem('sessionId')
}

const ifNotAuthenticated = (to, from, next) => {
  if (!isAuthenticated()) {
    next()
    return
  }
  next('/dashboard')
}

const ifAuthenticated = (to, from, next) => {
  if (isAuthenticated()) {
    next()
    return
  }
  next('/login')
}

const routes = [
  {
    path: '/',
    redirect: { name: 'login' }
  },
  {
    path: '/login',
    component: Login,
    name: 'login',
    beforeEnter: ifNotAuthenticated
  },
  {
    path: '/register',
    component: Register,
    name: 'register',
    beforeEnter: ifNotAuthenticated
  },
  {
    path: '/devices',
    component: Devices,
    name: 'devices',
    // Accessible to everyone
  },
  {
    path: '/device-details/:id',
    component: DeviceDetails,
    name: 'deviceDetails',
    props: true,
  },
  {
    path: '/dashboard',
    component: Dashboard,
    name: 'dashboard',
    beforeEnter: ifAuthenticated
  },
  {
    path: '/profile',
    component: Profile,
    name: 'profile',
    beforeEnter: ifAuthenticated
  },
  {
    path: '/home',
    name: 'home',
    component: HomeView
  },
  {
    path: '/about',
    name: 'about',
    // route level code-splitting
    // this generates a separate chunk (About.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: AboutView
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router

