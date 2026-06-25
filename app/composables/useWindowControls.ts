export function useWindowControls() {
  function minimizeWindow() {
    window.ytmp3?.minimizeWindow()
  }

  function toggleMaximizeWindow() {
    window.ytmp3?.toggleMaximizeWindow()
  }

  function closeWindow() {
    window.ytmp3?.closeWindow()
  }

  return {
    closeWindow,
    minimizeWindow,
    toggleMaximizeWindow
  }
}
