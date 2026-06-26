export function useThemeMode() {
  const isLightMode = ref(false)

  function toggleTheme() {
    isLightMode.value = !isLightMode.value
    document.documentElement.classList.toggle('dark', !isLightMode.value)
  }

  onMounted(() => {
    document.documentElement.classList.toggle('dark', !isLightMode.value)
  })

  return {
    isLightMode,

    toggleTheme
  }
}
