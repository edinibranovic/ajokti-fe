<template>
  <div class="container mx-auto py-4 flex justify-center items-center min-h-screen bg-gray-100">
    <div class="bg-white shadow rounded p-6 w-full max-w-lg">
      <h1 class="text-2xl font-bold mb-4 text-black">Profile</h1>
      <div class="bg-gray-50 p-4 rounded shadow-inner">
        <h2 class="text-lg font-semibold text-black mb-4">User Role: <span class="text-blue-600">{{ role }}</span></h2>
        <div class="flex justify-between space-x-2">
          <Button @click="logout" label="Logout" icon="pi pi-sign-out" class="p-button-secondary w-full"/>
          <Button @click="removeAccount" label="Remove Account" icon="pi pi-trash" class="p-button-danger w-full"/>
        </div>
      </div>
    </div>
    <Toast ref="toast" position="top-right" transitionOptions="fade" life="5000"/>
  </div>
</template>

<script setup>
import {onMounted, ref} from 'vue';
import {useRouter} from 'vue-router';
import axiosInstance from 'axios';
import Toast from 'primevue/toast';
import Button from 'primevue/button';

const router = useRouter();
const role = ref('');
const toast = ref(null);

const fetchRole = async () => {
  try {
    const response = await axiosInstance.post('api/user/getRole', {sessionId: localStorage.getItem('sessionId')});
    role.value = response.data.role;
  } catch (error) {
    toast.value.add({severity: 'error', summary: 'Error', detail: 'Failed to fetch role', life: 3000});
  }
};

const logout = () => {
  localStorage.removeItem('sessionId');
  localStorage.removeItem('role');
  toast.value.add({severity: 'info', summary: 'Logged Out', detail: 'You have successfully logged out.', life: 5000});
  setTimeout(() => {
    router.push('/login').then(() => {
      location.reload();
    });
  }, 3000);
};

const removeAccount = async () => {
  try {
    const password = prompt('Please enter your password to confirm account removal:');
    if (password) {
      const response = await axiosInstance.post('api/user/delete', {
        sessionId: localStorage.getItem('sessionId'),
        password,
      });
      toast.value.add({severity: 'success', summary: 'Account Removed', detail: response.data.message, life: 5000});
      localStorage.removeItem('sessionId');
      localStorage.removeItem('role');
      setTimeout(() => {
        router.push('/login').then(() => {
          location.reload();
        });
      }, 3000);
    } else {
      toast.value.add({severity: 'warn', summary: 'Cancelled', detail: 'Account removal cancelled', life: 3000});
    }
  } catch (error) {
    toast.value.add({severity: 'error', summary: 'Error', detail: 'Failed to remove account', life: 3000});
  }
};

onMounted(() => {
  fetchRole();
});
</script>

<style scoped>
.container {
  padding: 16px;
  background-color: #f7fafc;
}

.bg-gray-50 {
  background-color: #f9fafb;
}

.shadow-inner {
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
}

.p-button-secondary {
  background-color: #6b7280;
  border-color: #6b7280;
  color: #fff;
}

.p-button-secondary:hover {
  background-color: #4b5563;
  border-color: #4b5563;
}

.p-button-danger {
  background-color: #e11d48;
  border-color: #e11d48;
  color: #fff;
}

.p-button-danger:hover {
  background-color: #be123c;
  border-color: #be123c;
}
</style>
