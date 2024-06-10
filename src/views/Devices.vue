<template>
  <div class="container mx-auto mr-0 py-4 overflow-y-auto" style="max-height: 100vh;">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold text-black">Available Devices</h1>
      <div v-if="role === 'ADMIN'" class="admin-add-device">
        <Button @click="showAddDeviceDialog" label="Add Device" icon="pi pi-plus"
                class="p-button-success p-button-lg mt-4"/>
      </div>
    </div>
    <div class="flex flex-wrap -mx-2">
      <div
          v-for="device in devices"
          :key="device.sensorId"
          class="bg-white shadow rounded p-4 m-2 flex flex-col items-center relative transition-all duration-300"
          :class="{'collapsed-card': !device.showMeasurements, 'expanded-card': device.showMeasurements}"
          :style="{ width: 'calc((100% / 4) * 2.5)', maxWidth: '630px' }"
      >
        <div class="absolute top-2 left-2 text-gray-500">
          <UserGroupIcon class="h-6 w-6"/>
          <p class="ml-1">{{ device.latest?.numberOfPeople ?? 'N/A' }}</p>
        </div>
        <div v-if="isSubscribed(device.sensorId)" class="absolute top-2 right-2 text-green-500">
          <i class="pi pi-check-circle"></i>
        </div>
        <div :style="{ backgroundColor: device.color }" class="rounded-full p-4 mb-2 cursor-pointer"
             @click="goToDeviceDetails(device.sensorId)">
          <DeviceTabletIcon class="h-8 w-8 text-white"/>
        </div>
        <h2 class="text-lg font-semibold text-black">{{ device.name ?? 'Not available' }}</h2>
        <p class="text-gray-500">Sensor ID: {{ device.sensorId ?? 'Not available' }}</p>

        <div class="flex flex-col items-center w-full">
          <Button @click="toggleMeasurements(device)"
                  :label="device.showMeasurements ? 'Hide Measurements' : 'Show Measurements'"
                  :icon="device.showMeasurements ? 'pi pi-angle-down' : 'pi pi-angle-right'"
                  class="p-button-secondary text-gray-400 hover:text-gray-800 mt-2"/>
          <div v-if="isLoggedIn" class="flex justify-center mt-2 w-full space-y-2 flex-col items-center">
            <Button v-if="!isSubscribed(device.sensorId)" @click="subscribe(device.sensorId)" label="Subscribe"
                    icon="pi pi-bell" class="subscribe-button"/>
            <Button v-else @click="unsubscribe(device.sensorId)" label="Unsubscribe" icon="pi pi-bell-off"
                    class="unsubscribe-button"/>
          </div>
          <div v-if="role === 'ADMIN'" class="admin-actions flex justify-center mt-2 space-x-2">
            <Button @click="readKey(device.sensorId)" label="Read Key" icon="pi pi-key"
                    class="p-button-info admin-button text-gray-600"/>
            <Button @click="removeDevice(device.sensorId)" label="Remove Device" icon="pi pi-trash"
                    class="p-button-danger admin-button text-red-400"/>
          </div>
        </div>
        <transition :name="'fade-' + device.sensorId">
          <div v-if="device.showMeasurements" class="w-full mt-4">
            <h3 class="text-md font-medium mb-2 text-gray-800">Latest Measurements:</h3>
            <DataTable :value="getLastThreeMeasurements(device.measurements)" responsiveLayout="scroll"
                       :style="{ border: `1px solid ${device.color}` }" class="p-datatable-sm">
              <Column field="temperature" header="Temperature (°C)"
                      :style="{backgroundColor: '#f9f9f9', color: 'black'}"></Column>
              <Column field="humidity" header="Humidity (%)"
                      :style="{backgroundColor: '#f0f0f0', color: 'black'}"></Column>
              <Column field="gasValue" header="Gas Value"
                      :style="{backgroundColor: '#f9f9f9', color: 'black'}"></Column>
              <Column header="Time" :style="{backgroundColor: '#f0f0f0', color: 'black'}">
                <template #body="slotProps">
                  {{ formatDate(slotProps.data.dateTime) }}
                </template>
              </Column>
            </DataTable>
            <Button @click="goToDeviceDetails(device.sensorId)" label="View More" icon="pi pi-angle-right"
                    class="p-button-secondary mt-2 text-gray-400 hover:text-gray-800"/>
          </div>
        </transition>
      </div>
    </div>
    <Dialog v-model:visible="keyDialogVisible" header="Sensor Key" :modal="true" :closable="false" class="key-dialog">
      <div class="key-dialog-content">
        <p>{{ sensorKey }}</p>
        <div class="key-dialog-buttons">
          <Button label="Copy" icon="pi pi-copy" class="p-button-info" @click="copyKey"/>
          <Button label="Close" icon="pi pi-times" class="p-button-secondary" @click="keyDialogVisible = false"/>
        </div>
      </div>
    </Dialog>
    <Dialog v-model:visible="addDeviceDialogVisible" header="Add Device" :modal="true" :closable="true">
      <div class="p-4">
        <label for="deviceName" class="block text-sm font-medium text-gray-700">Device Name</label>
        <input id="deviceName" v-model="newDeviceName" type="text" class="mt-1 block w-full"/>
        <div class="flex justify-end mt-4">
          <Button @click="confirmAddDevice" label="Add" class="p-button-success"/>
        </div>
      </div>
    </Dialog>
    <Toast ref="toast" position="top-right"/>
  </div>
</template>

<script setup>
import {onMounted, ref} from 'vue';
import axiosInstance from '@/axios.js';
import {format} from 'date-fns';
import {useRouter} from 'vue-router';
import Toast from 'primevue/toast';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import {DeviceTabletIcon, UserGroupIcon} from '@heroicons/vue/24/outline';

const toast = ref(null);
const devices = ref([]);
const subscribedDevices = ref([]);
const keyDialogVisible = ref(false);
const addDeviceDialogVisible = ref(false);
const sensorKey = ref('');
const newDeviceName = ref('');
const router = useRouter();

const colors = ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#FF3333', '#33FFF3'];

const getRandomColor = () => {
  return colors[Math.floor(Math.random() * colors.length)];
};

const isLoggedIn = !!localStorage.getItem('sessionId');
const role = ref('');

const fetchRole = async () => {
  if (isLoggedIn) {
    try {
      const response = await axiosInstance.post('/user/getRole', {sessionId: localStorage.getItem('sessionId')});
      role.value = response.data.role;
    } catch (error) {
      toast.value.add({severity: 'error', summary: 'Error', detail: 'Failed to fetch role', life: 3000});
    }
  }
};

const fetchDevices = async () => {
  try {
    const response = await axiosInstance.get('/sensor/all');
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
    })));
    if (isLoggedIn) {
      await fetchSubscribedDevices();
    }
  } catch (error) {
    toast.value.add({severity: 'error', summary: 'Error', detail: 'Failed to fetch devices', life: 3000});
  }
};

const fetchMeasurements = async (sensorId) => {
  try {
    const response = await axiosInstance.get(`/measurement/get/${sensorId}`);
    return response.data;
  } catch (error) {
    toast.value.add({severity: 'error', summary: 'Error', detail: 'Failed to fetch measurements', life: 3000});
    return [];
  }
};

const fetchSubscribedDevices = async () => {
  try {
    const response = await axiosInstance.post('/user/dashboard', {sessionId: localStorage.getItem('sessionId')});
    subscribedDevices.value = response.data.map(device => device.sensorId);
  } catch (error) {
    toast.value.add({severity: 'error', summary: 'Error', detail: 'Failed to fetch subscribed devices', life: 3000});
  }
};

const toggleMeasurements = async (device) => {
  if (!device.showMeasurements) {
    try {
      const response = await axiosInstance.get(`/measurement/get/${device.sensorId}`);
      device.measurements = response.data;
      device.showMeasurements = true;
    } catch (error) {
      toast.value.add({severity: 'error', summary: 'Error', detail: 'Failed to fetch measurements', life: 3000});
    }
  } else {
    device.showMeasurements = false;
  }
};

const getLastThreeMeasurements = (measurements) => {
  return measurements.slice().sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime)).slice(0, 3);
};

const goToDeviceDetails = (sensorId) => {
  router.push({name: 'deviceDetails', params: {id: sensorId}});
};

const subscribe = async (sensorId) => {
  try {
    const response = await axiosInstance.post('/subscription/subscribe', {
      sessionId: localStorage.getItem('sessionId'),
      sensorId
    });
    toast.value.add({severity: 'success', summary: 'Subscribed', detail: response.data.message, life: 3000});
    subscribedDevices.value.push(sensorId);
  } catch (error) {
    toast.value.add({severity: 'error', summary: 'Error', detail: 'Failed to subscribe to device', life: 3000});
  }
};

const unsubscribe = async (sensorId) => {
  try {
    const response = await axiosInstance.post('/subscription/unsubscribe', {
      sessionId: localStorage.getItem('sessionId'),
      sensorId
    });
    toast.value.add({severity: 'success', summary: 'Unsubscribed', detail: response.data.message, life: 3000});
    subscribedDevices.value = subscribedDevices.value.filter(id => id !== sensorId);
  } catch (error) {
    toast.value.add({severity: 'error', summary: 'Error', detail: 'Failed to unsubscribe from device', life: 3000});
  }
};

const isSubscribed = (sensorId) => {
  return subscribedDevices.value.includes(sensorId);
};

const formatDate = (dateString) => {
  return format(new Date(dateString), 'dd.MM.yyyy, HH:mm:ss');
};

const showAddDeviceDialog = () => {
  addDeviceDialogVisible.value = true;
};

const confirmAddDevice = async () => {
  try {
    const sessionId = localStorage.getItem('sessionId');
    await axiosInstance.post('/sensor/add', {sessionId, name: newDeviceName.value});
    addDeviceDialogVisible.value = false;
    await fetchDevices();
    toast.value.add({severity: 'success', summary: 'Device Added', detail: 'Device added successfully', life: 3000});
  } catch (error) {
    toast.value.add({severity: 'error', summary: 'Error', detail: 'Failed to add device', life: 3000});
  }
};

const removeDevice = async (sensorId) => {
  try {
    const response = await axiosInstance.post('/sensor/remove', {sessionId: localStorage.getItem('sessionId'), sensorId});
    toast.value.add({severity: 'error', summary: 'Device Removed', detail: response.data.message, life: 3000});
    fetchDevices();
  } catch (error) {
    toast.value.add({severity: 'error', summary: 'Error', detail: 'Failed to remove device', life: 3000});
  }
};

const readKey = async (sensorId) => {
  try {
    const response = await axiosInstance.post('/sensor/getKey', {sessionId: localStorage.getItem('sessionId'), sensorId});
    sensorKey.value = response.data.sensorKey;
    keyDialogVisible.value = true;
    toast.value.add({severity: 'success', summary: 'Key Read', detail: response.data.message, life: 3000});
  } catch (error) {
    toast.value.add({severity: 'error', summary: 'Error', detail: 'Failed to read key', life: 3000});
  }
};

const copyKey = () => {
  navigator.clipboard.writeText(sensorKey.value);
  toast.value.add({severity: 'success', summary: 'Copied', detail: 'Sensor key copied to clipboard', life: 3000});
};

onMounted(() => {
  fetchRole();
  fetchDevices();
});
</script>

<style scoped>
.container {
  padding: 16px;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter, .fade-leave-to /* .fade-leave-active in <2.1.8 */
{
  opacity: 0;
}

.p-datatable {
  width: 100%;
}

.p-datatable-thead > tr > th {
  text-align: left;
  color: #333; /* Slightly lighter black */
}

.p-datatable-tbody > tr > td {
  padding: 8px;
  text-align: left;
  color: #333; /* Slightly lighter black */
}

.p-datatable-sm .p-datatable-thead > tr > th {
  padding: 0.5rem;
}

.p-datatable-sm .p-datatable-tbody > tr > td {
  padding: 0.5rem;
}

.collapsed-card {
  max-height: 240px;
  overflow: hidden;
}

.expanded-card {
  max-height: none;
}

.subscribe-button, .unsubscribe-button, .admin-actions button {
  transition: background-color 0.3s ease, transform 0.2s ease;
  padding: 0.5rem 1.5rem;
}

.subscribe-button:hover, .unsubscribe-button:hover, .admin-actions button:hover {
  transform: scale(1.05);
}

.subscribe-button {
  background-color: rgba(76, 175, 80, 0.5);
  border-color: rgba(76, 175, 80, 0.5);
  color: white;
}

.subscribe-button:hover {
  background-color: rgba(76, 175, 80, 0.7);
  border-color: rgba(76, 175, 80, 0.7);
}

.unsubscribe-button {
  background-color: rgba(244, 67, 54, 0.5);
  border-color: rgba(244, 67, 54, 0.5);
  color: white;
}

.unsubscribe-button:hover {
  background-color: rgba(244, 67, 54, 0.7);
  border-color: rgba(244, 67, 54, 0.7);
}

.admin-actions {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin-top: 20px;
  width: 100%;
}

.admin-button {
  background-color: #666; /* Darker color for visibility */
  color: white;
}

.admin-button:hover {
  background-color: #444; /* Even darker on hover */
}

.admin-add-device {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  color: black;
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
