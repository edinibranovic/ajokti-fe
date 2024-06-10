<template>
  <div class="text-black bg-gray-100 flex flex-col overflow-y-auto" style="max-height: 100vh;">
    <div class="bg-blue-500 text-white p-4 flex justify-between items-center">
      <h1 class="text-xl">Device Details</h1>
      <button @click="goBack" class="bg-blue-500 py-2 px-4 rounded flex items-center">
        <ArrowLeftIcon class="h-5 w-5 mr-1"/>
        Back
      </button>
    </div>
    <div class="p-4 flex-grow flex flex-col items-center overflow-y-auto">
      <div v-if="device" class="p-4 border rounded shadow-sm bg-white w-full max-w-4xl relative">
        <div class="absolute top-2 right-10 text-gray-500">
          <UserGroupIcon class="h-6 w-6"/>
          <p class="ml-1">{{ device.latest?.numberOfPeople ?? 'N/A' }}</p>
        </div>
        <div v-if="isSubscribed(device.sensorId)" class="absolute top-2 right-2 text-green-500">
          <CheckCircleIcon class="h-6 w-6"/>
        </div>
        <div class="flex items-center mb-4">
          <DeviceTabletIcon class="h-16 w-16"/>
          <div class="ml-4">
            <h3 class="text-xl">{{ device.name ?? 'Not available' }}</h3>
            <p class="text-gray-500">Sensor ID: {{ deviceId }}</p>
          </div>
        </div>
        <div v-if="isLoggedIn && isSubscribed(device.sensorId)" class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p class="font-bold">Latest Readings:</p>
            <ul>
              <li>Temperature: {{ device.latest?.temperature ?? 'Not available' }}°C</li>
              <li>Humidity: {{ device.latest?.humidity ?? 'Not available' }}%</li>
              <li>Gas Value: {{ device.latest?.gasValue ?? 'Not available' }}</li>
              <li>Date/Time:
                {{ device.latest?.dateTime ? new Date(device.latest.dateTime).toLocaleString() : 'Not available' }}
              </li>
            </ul>
          </div>
          <div>
            <p class="font-bold">Last Alarming Readings:</p>
            <ul>
              <li>Temperature: {{ device.alarming?.temperature ?? 'Not available' }}°C</li>
              <li>Humidity: {{ device.alarming?.humidity ?? 'Not available' }}%</li>
              <li>Gas Value: {{ device.alarming?.gasValue ?? 'Not available' }}</li>
              <li>Date/Time:
                {{ device.alarming?.dateTime ? new Date(device.alarming.dateTime).toLocaleString() : 'Not available' }}
              </li>
            </ul>
          </div>
        </div>
        <div v-if="isLoggedIn" class="flex space-x-2 mb-4">
          <button v-if="isSubscribed(device.sensorId)" @click="unsubscribe(device.sensorId)"
                  class="bg-red-500 py-1 px-2 rounded text-white flex items-center">
            <BellSlashIcon class="h-5 w-5 mr-1"/>
            Unsubscribe
          </button>
          <button v-else @click="subscribe(device.sensorId)"
                  class="bg-green-500 py-1 px-2 rounded text-white flex items-center">
            <BellIcon class="h-5 w-5 mr-1"/>
            Subscribe
          </button>
          <button v-if="isAdmin" @click="removeDevice(deviceId)"
                  class="bg-red-500 py-1 px-2 rounded text-white flex items-center">
            <TrashIcon class="h-5 w-5 mr-1"/>
            Remove
          </button>
          <button v-if="isAdmin" @click="getDeviceKey(device.sensorId)"
                  class="bg-green-500 py-1 px-2 rounded text-white flex items-center">
            <KeyIcon class="h-5 w-5 mr-1"/>
            Get Key
          </button>
          <button @click="refreshMeasurements" class="bg-yellow-500 py-1 px-2 rounded text-white flex items-center">
            <ArrowDownCircleIcon class="h-5 w-5 mr-1"/>
            Refresh Measurements
          </button>
        </div>
        <div>
          <h3 class="text-md font-medium mb-2 text-gray-800">All Measurements:</h3>
          <DataTable :value="device.measurements" responsiveLayout="scroll"
                     :style="{ border: `1px solid ${device.color}` }" class="p-datatable-sm">
            <Column field="temperature" header="Temperature (°C)"
                    :style="{ backgroundColor: '#f9f9f9', color: 'black' }"></Column>
            <Column field="humidity" header="Humidity (%)"
                    :style="{ backgroundColor: '#f0f0f0', color: 'black' }"></Column>
            <Column field="gasValue" header="Gas Value"
                    :style="{ backgroundColor: '#f9f9f9', color: 'black' }"></Column>
            <Column header="Time" :style="{ backgroundColor: '#f0f0f0', color: 'black' }">
              <template #body="slotProps">
                {{ formatDate(slotProps.data.dateTime) }}
              </template>
            </Column>
          </DataTable>
        </div>
      </div>
      <p v-else>No device found.</p>
    </div>
    <Dialog v-model:visible="keyDialogVisible" header="Sensor Key" :modal="true" :closable="false" class="key-dialog">
      <div class="key-dialog-content">
        <p>Device ID: {{ deviceIdForKey }}</p>
        <p>{{ sensorKey }}</p>
        <div class="key-dialog-buttons">
          <button @click="copyKey" class="bg-blue-500 py-1 px-2 rounded text-white flex items-center">
            <DocumentDuplicateIcon class="h-5 w-5 mr-1"/>
            Copy Key
          </button>
          <button @click="keyDialogVisible = false" class="bg-red-500 py-1 px-2 rounded text-white flex items-center">
            <XMarkIcon class="h-5 w-5 mr-1"/>
            Close
          </button>
        </div>
      </div>
    </Dialog>
    <transition name="fade">
      <div v-if="toast.visible" :class="['toast', toast.type]" @transitionend="onToastTransitionEnd">
        {{ toast.message }}
      </div>
    </transition>
  </div>
</template>

<script setup>
import {onMounted, ref} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import axiosInstance from '@/axios.js';
import {
  ArrowDownCircleIcon,
  ArrowLeftIcon,
  BellIcon,
  BellSlashIcon,
  CheckCircleIcon,
  DeviceTabletIcon,
  DocumentDuplicateIcon,
  KeyIcon,
  TrashIcon,
  UserGroupIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline' // Assume you have an icon component
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'

const route = useRoute()
const router = useRouter()
const deviceId = route.params.id

const device = ref(null)
const isAdmin = ref(false)
const isLoggedIn = ref(false)
const subscribedDevices = ref([])
const keyDialogVisible = ref(false)
const sensorKey = ref('')
const deviceIdForKey = ref('')

const toast = ref({
  visible: false,
  message: '',
  type: ''
})

const showToast = (message, type = 'success') => {
  toast.value = {visible: true, message, type}
  setTimeout(() => {
    toast.value.visible = false
  }, 5000)
}

const onToastTransitionEnd = () => {
  if (!toast.value.visible) {
    toast.value.message = ''
    toast.value.type = ''
  }
}

const fetchDevice = async () => {
  try {
    const sessionId = localStorage.getItem('sessionId')
    if (sessionId) {
      isLoggedIn.value = true
      const response = await axiosInstance.post('/user/dashboard', {sessionId})
      const deviceData = response.data.find(device => device.sensorId === deviceId)
      device.value = {
        ...deviceData,
        measurements: await fetchMeasurements(deviceId),
        color: getRandomColor()
      }
      await fetchSubscribedDevices(sessionId)
      const roleResponse = await axiosInstance.post('/user/getRole', {sessionId}, {baseURL: '/'})
      isAdmin.value = roleResponse.data.role === 'ADMIN'
      showToast('Device details fetched successfully', 'success')
    } else {
      const measurements = await fetchMeasurements(deviceId)
      device.value = {
        sensorId: deviceId,
        measurements,
        color: getRandomColor()
      }
    }
  } catch (error) {
    console.error('Failed to fetch device details:', error)
    showToast('Failed to fetch device details', 'error')
  }
}

const fetchMeasurements = async (deviceId) => {
  try {
    const response = await axiosInstance.get(`/api/measurement/get/${deviceId}`)
    return response.data
  } catch (error) {
    console.error('Failed to fetch measurements:', error)
    showToast('Failed to fetch measurements', 'error')
    return []
  }
}

const fetchSubscribedDevices = async (sessionId) => {
  try {
    const response = await axiosInstance.post('/user/dashboard', {sessionId})
    subscribedDevices.value = response.data.map(device => device.sensorId)
  } catch (error) {
    console.error('Failed to fetch subscribed devices:', error)
    showToast('Failed to fetch subscribed devices', 'error')
  }
}

const refreshMeasurements = async () => {
  try {
    const measurements = await fetchMeasurements(deviceId)
    device.value.measurements = measurements
    showToast('Measurements refreshed successfully', 'success')
  } catch (error) {
    console.error('Failed to refresh measurements:', error)
    showToast('Failed to refresh measurements', 'error')
  }
}

const goBack = () => {
  const previousRoute = router.options.history.state.back
  if (previousRoute && (previousRoute.includes('/dashboard') || previousRoute.includes('/devices'))) {
    router.push(previousRoute)
  } else {
    router.push('/dashboard')
  }
}

const subscribe = async (sensorId) => {
  try {
    const sessionId = localStorage.getItem('sessionId')
    const response = await axiosInstance.post('/subscription/subscribe', {sessionId, sensorId: deviceId})
    showToast('Subscribed successfully', 'success')
    subscribedDevices.value.push(sensorId)
  } catch (error) {
    console.error('Failed to subscribe:', error)
    showToast('Failed to subscribe', 'error')
  }
}

const unsubscribe = async (sensorId) => {
  try {
    const sessionId = localStorage.getItem('sessionId')
    await axiosInstance.post('/subscription/unsubscribe', {sessionId, sensorId: deviceId})
    await fetchDevice()
    showToast('Unsubscribed successfully', 'success')
  } catch (error) {
    console.error('Failed to unsubscribe:', error)
    showToast('Failed to unsubscribe', 'error')
  }
}

const removeDevice = async (sensorId) => {
  try {
    const sessionId = localStorage.getItem('sessionId')
    await axiosInstance.post('/sensor/remove', {sessionId, sensorId})
    goBack()
    showToast('Device removed successfully', 'success')
  } catch (error) {
    console.error('Failed to remove device:', error)
    showToast('Failed to remove device', 'error')
  }
}

const getDeviceKey = async (sensorId) => {
  try {
    const sessionId = localStorage.getItem('sessionId')
    const response = await axiosInstance.post('/sensor/getKey', {sessionId, sensorId})
    sensorKey.value = response.data.key
    deviceIdForKey.value = sensorId
    keyDialogVisible.value = true
    showToast('Device key retrieved', 'success')
  } catch (error) {
    console.error('Failed to get device key:', error)
    showToast('Failed to get device key', 'error')
  }
}

const copyKey = () => {
  navigator.clipboard.writeText(sensorKey.value)
  showToast('Sensor key copied to clipboard', 'success')
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString()
}

const getRandomColor = () => {
  const colors = ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#FF3333', '#33FFF3']
  return colors[Math.floor(Math.random() * colors.length)]
}

const isSubscribed = (sensorId) => {
  return subscribedDevices.value.includes(sensorId)
}

onMounted(async () => {
  await fetchDevice()
})
</script>

<style scoped>
html, body {
  height: 100%;
  overflow: hidden;
}

#app {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 10px 20px;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.toast.success {
  background-color: #48bb78;
  color: white;
}

.toast.error {
  background-color: #f56565;
  color: white;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s, transform 0.5s;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.key-dialog {
  width: 300px;
}

.key-dialog-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
}

.key-dialog-buttons {
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-top: 1rem;
}
</style>
