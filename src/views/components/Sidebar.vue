<template>
  <div class="flex flex-col h-full bg-gray-800 text-white relative">
    <div class="flex items-center justify-center h-16 bg-gray-900">
      <h1 class="text-xl font-semibold">A Jok Ti</h1>
    </div>
    <nav class="flex-1 px-2 py-4 space-y-1">
      <transition name="flash">
        <router-link
            v-if="!isLoggedIn"
            to="/"
            class="group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-700 hover:text-white"
        >
          <HomeIcon class="mr-3 h-6 w-6 text-gray-400 group-hover:text-gray-300"/>
          Login
        </router-link>
      </transition>
      <router-link
          to="/devices"
          class="group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-700 hover:text-white"
      >
        <DeviceTabletIcon class="mr-3 h-6 w-6 text-gray-400 group-hover:text-gray-300"/>
        Devices
      </router-link>
      <transition name="flash">
        <router-link
            v-if="isLoggedIn"
            to="/dashboard"
            class="group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-700 hover:text-white"
        >
          <ChartBarIcon class="mr-3 h-6 w-6 text-gray-400 group-hover:text-gray-300"/>
          Dashboard
        </router-link>
      </transition>
      <transition name="flash">
        <div v-if="isLoggedIn" class="relative group">
          <router-link
              to="/profile"
              class="flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-700 hover:text-white"
              @mouseover="showTooltip"
          >
            <UserCircleIcon class="mr-3 h-6 w-6 text-gray-400 group-hover:text-gray-300"/>
            Profile
          </router-link>
          <div
              v-show="tooltipVisible"
              class="absolute left-full ml-2 bg-gray-700 text-white text-sm rounded-md shadow-lg p-2 transition-opacity duration-300 opacity-0 group-hover:opacity-100 flex flex-col z-50"
              @mouseover="showTooltip"
              @mouseleave="hideTooltipWithDelay"
          >
            <router-link to="/profile" class="block px-4 py-2 hover:bg-gray-600 rounded-md">View Profile</router-link>
            <button @click="logout" class="block w-full text-left px-4 py-2 hover:bg-gray-600 rounded-md">Logout
            </button>
          </div>
        </div>
      </transition>
    </nav>
    <transition name="flash">
      <div v-if="role === 'ADMIN'" class="px-4 pl-10 py-2 text-l font-medium rounded-md">
        ADMIN
      </div>
    </transition>
    <Toast ref="toast" position="top-right" transitionOptions="fade" life="5000"/>
  </div>
</template>

<script setup>
import {onMounted, ref} from 'vue'
import axiosInstance from '@/axios.js';
import {useRouter} from 'vue-router'
import {ChartBarIcon, DeviceTabletIcon, HomeIcon, UserCircleIcon} from '@heroicons/vue/24/outline'
import Toast from 'primevue/toast';

const router = useRouter()

const isLoggedIn = ref(false)
const role = ref('')
const tooltipVisible = ref(false)
let hideTooltipTimeout = null
const toast = ref(null)

const checkLoginStatus = async () => {
  const sessionId = localStorage.getItem('sessionId')
  if (sessionId) {
    isLoggedIn.value = true
    try {
      const response = await axiosInstance.post('api/user/getRole', {sessionId})
      role.value = response.data.role
    } catch (error) {
      console.error('Error fetching role:', error)
    }
  } else {
    isLoggedIn.value = false
  }
}

const showTooltip = () => {
  if (hideTooltipTimeout) {
    clearTimeout(hideTooltipTimeout)
  }
  tooltipVisible.value = true
}

const hideTooltipWithDelay = () => {
  hideTooltipTimeout = setTimeout(() => {
    tooltipVisible.value = false
  }, 300)
}

const logout = () => {
  localStorage.removeItem('sessionId')
  localStorage.removeItem('role')
  isLoggedIn.value = false
  role.value = ''
  toast.value.add({severity: 'info', summary: 'Logged Out', detail: 'You have successfully logged out.', life: 5000})
  window.location.reload()
}

onMounted(() => {
  checkLoginStatus()
})
</script>

<style scoped>
.group-hover .group-hover\:block {
  display: block;
}

.group:hover .group-hover\:flex {
  display: flex;
}

/* Flash animation for Profile, Dashboard, and Admin tabs */
@keyframes flash-in {
  0% {
    background-color: transparent;
  }
  50% {
    background-color: #4caf50;
  }
  100% {
    background-color: transparent;
  }
}

@keyframes flash-out {
  0% {
    background-color: transparent;
  }
  50% {
    background-color: #f44336;
  }
  100% {
    background-color: transparent;
  }
}

.flash-enter-active {
  animation: flash-in 0.5s ease-in-out;
}

.flash-leave-active {
  animation: flash-out 0.5s ease-in-out;
}

/* Position Admin tab at the bottom */
nav {
  display: flex;
  flex-direction: column;
}

nav > .flex-1 {
  flex: 1;
}

.z-50 {
  z-index: 50;
}

/* Fade in and fade out for Toast */
.p-toast {
  width: auto;
}

.p-toast-message {
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter, .fade-leave-to /* .fade-leave-active in <2.1.8 */
{
  opacity: 0;
}
</style>
