<template>
  <div
      class="toast"
      :class="typeClass"
      @click="close"
      :style="{ top: `${top}px` }"
  >
    {{ message }}
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  message: String,
  type: {
    type: String,
    default: 'info'
  }
})
const emit = defineEmits(['close'])

const top = ref(-100)
const timeoutId = ref(null)

const typeClass = computed(() => {
  switch (props.type) {
    case 'success':
      return 'toast-success'
    case 'error':
      return 'toast-error'
    default:
      return 'toast-info'
  }
})

const close = () => {
  emit('close')
}

onMounted(() => {
  setTimeout(() => {
    top.value = 20
    timeoutId.value = setTimeout(() => {
      close()
    }, 3000)
  }, 100)
})

onBeforeUnmount(() => {
  clearTimeout(timeoutId.value)
})

watch(props.message, (newMessage) => {
  if (newMessage) {
    clearTimeout(timeoutId.value)
    timeoutId.value = setTimeout(() => {
      close()
    }, 3000)
  }
})
</script>

<style scoped>
.toast {
  position: absolute;
  right: 20px;
  padding: 10px 20px;
  border-radius: 5px;
  color: white;
  font-size: 16px;
  transition: top 0.5s;
  cursor: pointer;
}

.toast-success {
  background-color: #48bb78;
}

.toast-error {
  background-color: #f56565;
}

.toast-info {
  background-color: #3182ce;
}
</style>
