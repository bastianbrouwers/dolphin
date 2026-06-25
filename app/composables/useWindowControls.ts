export function useWindowControls() {
  function minimizeWindow() {
    window.dolphin?.minimizeWindow()
  }

  function toggleMaximizeWindow() {
    window.dolphin?.toggleMaximizeWindow()
  }

  function closeWindow() {
    window.dolphin?.closeWindow()
  }

  return {
    closeWindow,
    minimizeWindow,
    toggleMaximizeWindow
  }
}
