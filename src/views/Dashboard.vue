<template>
  <div class="text-black bg-gray-100 overflow-y-auto" style="max-height: 100vh !important;">
    <div class="bg-blue-500 text-white p-4 flex justify-between items-center">
      <h1 class="text-xl">Dashboard</h1>
    </div>
    <div class="p-4">
      <h2 class="text-2xl mb-4">Devices</h2>
      <ul v-if="devices.length" class="space-y-4">
        <li v-for="device in devices" :key="device.sensorId" class="p-4 border rounded shadow-sm bg-white">
          <button @click="goToDeviceDetails(device.sensorId)" class="device-button">
            <div class="flex items-center mb-2">
              <DeviceTabletIcon class="h-16 w-16"/>
              <div class="ml-4">
                <h3 class="text-xl">{{ device.name ?? 'Not available' }}</h3>
                <p class="text-gray-500">Sensor ID: {{ device.sensorId ?? 'Not available' }}</p>
              </div>
              <div class="ml-auto flex items-center text-gray-500">
                <UserGroupIcon class="h-6 w-6"/>
                <p class="ml-1">{{ device.latest?.numberOfPeople ?? 'N/A' }}</p>
              </div>
            </div>
          </button>
          <p><strong>Latest Readings:</strong></p>
          <ul class="mb-2">
            <li>Temperature: {{ device.latest?.temperature ?? 'Not available' }}°C</li>
            <li>Humidity: {{ device.latest?.humidity ?? 'Not available' }}%</li>
            <li>Gas Value: {{ device.latest?.gasValue ?? 'Not available' }}</li>
            <li>Date/Time:
              {{ device.latest?.dateTime ? new Date(device.latest.dateTime).toLocaleString() : 'Not available' }}
            </li>
          </ul>
          <p><strong>Last Alarming Readings:</strong></p>
          <ul class="mb-2">
            <li>Temperature: {{ device.alarming?.temperature ?? 'Not available' }}°C</li>
            <li>Humidity: {{ device.alarming?.humidity ?? 'Not available' }}%</li>
            <li>Gas Value: {{ device.alarming?.gasValue ?? 'Not available' }}</li>
            <li>Date/Time:
              {{ device.alarming?.dateTime ? new Date(device.alarming.dateTime).toLocaleString() : 'Not available' }}
            </li>
          </ul>
          <div class="flex space-x-2 mt-2">
            <button @click="unsubscribe(device.sensorId)"
                    class="bg-red-500 py-1 px-2 rounded text-white flex items-center">
              <BellSlashIcon class="h-5 w-5 mr-1"/>
              Unsubscribe
            </button>
            <button v-if="isAdmin" @click="removeDevice(device.sensorId)"
                    class="bg-red-500 py-1 px-2 rounded text-white flex items-center">
              <TrashIcon class="h-5 w-5 mr-1"/>
              Remove
            </button>
            <button v-if="isAdmin" @click="getDeviceKey(device.sensorId)"
                    class="bg-green-500 py-1 px-2 rounded text-white flex items-center">
              <KeyIcon class="h-5 w-5 mr-1"/>
              Get Key
            </button>
            <button @click="refreshMeasurements(device)"
                    class="bg-yellow-500 py-1 px-2 rounded text-white flex items-center">
              <ArrowDownCircleIcon class="h-5 w-5 mr-1"/>
              Refresh Measurements
            </button>
          </div>
          <button @click="toggleMeasurements(device)" class="bg-blue-500 py-1 px-2 rounded text-white mt-2">
            {{ device.showMeasurements ? 'Hide Measurements' : 'Show Measurements' }}
          </button>
          <transition name="fade">
            <div class="w-full mt-4"
                 v-if="device.showMeasurements && device.measurements && device.measurements.length">
              <h3 class="text-md font-medium mb-2 text-gray-800">All Measurements:</h3>
              <DataTable :value="device.measurements" responsiveLayout="scroll"
                         :style="{ border: `1px solid ${device.color}` }" class="p-datatable-sm">
                <Column field="temperature" header="Temperature (°C)"
                        :style="{ backgroundColor: '#f9f9f9', color: 'black' }">
                  <template #body="slotProps">
                    {{ slotProps.data.temperature ?? 'Not available' }}
                  </template>
                </Column>
                <Column field="humidity" header="Humidity (%)"
                        :style="{ backgroundColor: '#f0f0f0', color: 'black' }">
                  <template #body="slotProps">
                    {{ slotProps.data.humidity ?? 'Not available' }}
                  </template>
                </Column>
                <Column field="gasValue" header="Gas Value"
                        :style="{ backgroundColor: '#f9f9f9', color: 'black' }">
                  <template #body="slotProps">
                    {{ slotProps.data.gasValue ?? 'Not available' }}
                  </template>
                </Column>
                <Column header="Time" :style="{ backgroundColor: '#f0f0f0', color: 'black' }">
                  <template #body="slotProps">
                    {{ slotProps.data.dateTime ? formatDate(slotProps.data.dateTime) : 'Not available' }}
                  </template>
                </Column>
              </DataTable>
            </div>
          </transition>
        </li>
      </ul>
      <p v-else>No devices found.</p>
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
    <Dialog v-model:visible="addDeviceDialogVisible" header="Add Device" :modal="true" :closable="true">
      <div class="p-4">
        <label for="deviceName" class="block text-sm font-medium text-gray-700">Device Name</label>
        <input id="deviceName" v-model="newDeviceName" type="text" class="mt-1 block w-full"/>
        <div class="flex justify-end mt-4">
          <button @click="confirmAddDevice" class="bg-blue-500 py-2 px-4 rounded text-white flex items-center">
            Add
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
import axios from 'axios'
import {useRouter} from 'vue-router'
import {
  ArrowDownCircleIcon,
  BellSlashIcon,
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

const devices = ref([])
const isAdmin = ref(false)
const keyDialogVisible = ref(false)
const addDeviceDialogVisible = ref(false)
const sensorKey = ref('')
const deviceIdForKey = ref('')
const newDeviceName = ref('')
const router = useRouter()

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

const fetchDevices = async () => {
  try {
    const sessionId = localStorage.getItem('sessionId')
    const response = await axios.post('/api/user/dashboard', {sessionId})
    devices.value = await Promise.all(response.data.map(async (device) => ({
      sensorId: device.sensorId ?? 'Not available',
      name: device.name ?? 'Not available',
      latest: {
        temperature: device.latest?.temperature ?? 'Not available',
        humidity: device.latest?.humidity ?? 'Not available',
        gasValue: device.latest?.gasValue ?? 'Not available',
        dateTime: device.latest?.dateTime ?? null,
        numberOfPeople: device.latest?.numberOfPeople ?? 'N/A'
      },
      alarming: {
        temperature: device.alarming?.temperature ?? 'Not available',
        humidity: device.alarming?.humidity ?? 'Not available',
        gasValue: device.alarming?.gasValue ?? 'Not available',
        dateTime: device.alarming?.dateTime ?? null,
      },
      color: getRandomColor(),
      showMeasurements: false,
      measurements: await fetchMeasurements(device.sensorId)
    })))
    const roleResponse = await axios.post('/api/user/getRole', {sessionId}, {baseURL: '/'})
    isAdmin.value = roleResponse.data.role === 'ADMIN'
    showToast('Devices fetched successfully', 'success')
  } catch (error) {
    console.error('Failed to fetch devices:', error)
    showToast('Failed to fetch devices', 'error')
  }
}

const fetchMeasurements = async (sensorId) => {
  try {
    const response = await axios.get(`/api/measurement/get/${sensorId}`)
    return response.data
  } catch (error) {
    console.error('Failed to fetch measurements:', error)
    showToast('Failed to fetch measurements', 'error')
    return []
  }
}

const logout = () => {
  localStorage.removeItem('sessionId')
  router.push('/')
  showToast('Logged out successfully', 'success')
}

const unsubscribe = async (deviceId) => {
  try {
    const sessionId = localStorage.getItem('sessionId')
    await axios.post('/api/subscription/unsubscribe', {sessionId, sensorId: deviceId})
    await fetchDevices()
    showToast('Unsubscribed successfully', 'success')
  } catch (error) {
    console.error('Failed to unsubscribe:', error)
    showToast('Failed to unsubscribe', 'error')
  }
}

const removeDevice = async (deviceId) => {
  try {
    const sessionId = localStorage.getItem('sessionId')
    await axios.post('/api/sensor/remove', {sessionId, sensorId: deviceId})
    await fetchDevices()
    showToast('Device removed successfully', 'success')
  } catch (error) {
    console.error('Failed to remove device:', error)
    showToast('Failed to remove device', 'error')
  }
}

const getDeviceKey = async (deviceId) => {
  try {
    const sessionId = localStorage.getItem('sessionId')
    const response = await axios.post('/api/sensor/getKey', {sessionId, sensorId: deviceId})
    sensorKey.value = response.data.key
    deviceIdForKey.value = deviceId
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

const showAddDeviceDialog = () => {
  addDeviceDialogVisible.value = true
}

const confirmAddDevice = async () => {
  try {
    const sessionId = localStorage.getItem('sessionId')
    await axios.post('/api/sensor/add', {sessionId, name: newDeviceName.value})
    addDeviceDialogVisible.value = false
    await fetchDevices()
    showToast('Device added successfully', 'success')
  } catch (error) {
    console.error('Failed to add device:', error)
    showToast('Failed to add device', 'error')
  }
}

const toggleMeasurements = async (device) => {
  if (!device.showMeasurements) {
    try {
      const response = await axios.get(`/api/measurement/get/${device.sensorId}`)
      device.measurements = response.data
      device.showMeasurements = true
    } catch (error) {
      console.error('Failed to fetch measurements:', error)
      showToast('Failed to fetch measurements', 'error')
    }
  } else {
    device.showMeasurements = false
  }
}

const refreshMeasurements = async (device) => {
  try {
    const response = await axios.get(`/api/measurement/get/${device.sensorId}`)
    device.measurements = response.data
    showToast('Measurements refreshed successfully', 'success')
  } catch (error) {
    console.error('Failed to refresh measurements:', error)
    showToast('Failed to refresh measurements', 'error')
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString()
}

const getRandomColor = () => {
  const colors = ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#FF3333', '#33FFF3']
  return colors[Math.floor(Math.random() * colors.length)]
}

const goToDeviceDetails = (sensorId) => {
  router.push({name: 'deviceDetails', params: {id: sensorId}})
}

onMounted(async () => {
  await fetchDevices()
})
</script>

<style scoped>
.border-red-500 {
  border-color: #f56565;
}

.text-red-500 {
  color: #f56565;
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

.device-button {
  display: block;
  width: 100%;
  text-align: left;
  padding: 1rem;
  background: #f0f0f0;
  border-radius: 8px;
  transition: transform 0.3s ease, background-color 0.3s ease;
}

.device-button:hover {
  transform: translateY(-5px);
  background-color: #e0e0e0;
}
</style>
