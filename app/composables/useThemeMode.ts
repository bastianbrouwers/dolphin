export function useThemeMode() {
  const isLightMode = ref(false)

  onMounted(() => {
    document.documentElement.classList.toggle('dark', !isLightMode.value)
  })

  function toggleTheme() {
    isLightMode.value = !isLightMode.value
    document.documentElement.classList.toggle('dark', !isLightMode.value)
  }

  return {
    isLightMode,

    toggleTheme
  }
}
