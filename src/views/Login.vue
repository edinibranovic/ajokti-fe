<template>
  <div class="flex text-black flex-col justify-center items-center min-h-screen bg-gray-100">
    <form @submit.prevent="login" class="bg-white p-6 rounded shadow-md w-80">
      <h2 class="text-2xl mb-4">Login</h2>
      <div class="mb-4">
        <label class="block mb-1">Email</label>
        <input v-model="email" type="email" class="w-full px-4 py-2 border rounded" required>
      </div>
      <div class="mb-4">
        <label class="block mb-1">Password</label>
        <input v-model="password" type="password" class="w-full px-4 py-2 border rounded" required>
      </div>
      <button type="submit" class="w-full bg-blue-500 text-white py-2 rounded" :disabled="isSubmitting">
        <span v-if="isSubmitting" class="absolute inset-0 flex justify-center items-center">
          <span class="spinner-border spinner-border-sm"></span>
        </span>
        <span :class="{ 'invisible': isSubmitting }">Login</span>
      </button>
    </form>
    <p @click="router.push('/register')" class="mt-4">
      Don't have an account?
      <router-link to="/register" class="text-blue-500">Register here</router-link>
    </p>

    <Toast ref="toast" position="top-right" transitionOptions="fade" life="5000" class="mb-4"/>
  </div>
</template>

<script setup>
import {ref} from 'vue'
import axiosInstance from '@/axios.js'
import {useRouter} from 'vue-router'
import Toast from 'primevue/toast';
import 'primevue/resources/themes/saga-blue/theme.css';
import 'primevue/resources/primevue.min.css';
import 'primeicons/primeicons.css';

const email = ref('')
const password = ref('')
const isSubmitting = ref(false)
const router = useRouter()
const toast = ref(null)

const login = async () => {
  isSubmitting.value = true
  try {
    const response = await axiosInstance.post('/api/user/login', {
      email: email.value,
      password: password.value,
    })
    const {sessionId, role} = response.data

    // Store sessionId and role in local storage
    localStorage.setItem('sessionId', sessionId)
    localStorage.setItem('role', role)

    toast.value.add({severity: 'success', summary: 'Success', detail: 'Login successful!', life: 5000})

    setTimeout(() => {
      router.push('/devices').then(() => {
        window.location.reload() // Force page refresh after route change
      });
    }, 2000)
  } catch (error) {
    const errorMessage = error.response && error.response.data ? error.response.data.message : 'Login failed'
    toast.value.add({severity: 'error', summary: 'Error', detail: errorMessage, life: 5000})
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.border-red-500 {
  border-color: #f56565;
}

.text-red-500 {
  color: #f56565;
}

.spinner-border {
  border: 2px solid transparent;
  border-radius: 50%;
  border-top-color: #fff;
  width: 1rem;
  height: 1rem;
  animation: spinner 0.75s linear infinite;
}

@keyframes spinner {
  to {
    transform: rotate(360deg);
  }
}

.invisible {
  visibility: hidden;
}

.p-toast {
  width: auto;
}

.p-toast-message {
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.p-toast-message-success {
  background-color: #4caf50;
  color: #fff;
}

.p-toast-message-error {
  background-color: #f44336;
  color: #fff;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter, .fade-leave-to /* .fade-leave-active in <2.1.8 */
{
  opacity: 0;
}
</style>
