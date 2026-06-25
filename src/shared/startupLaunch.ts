// Phase 2 Deferred Slice 5: testable startup launch setting controller.
// Pure shared module with an injected OS/Electron adapter interface.

export interface StartupLaunchAdapter {
  getOpenAtLogin: () => boolean
  setOpenAtLogin: (enabled: boolean) => void
}

export interface StartupLaunchController {
  getEnabled: () => boolean
  setEnabled: (enabled: boolean) => boolean
  toggle: () => boolean
}

export function createStartupLaunchController(
  adapter: StartupLaunchAdapter,
): StartupLaunchController {
  return {
    getEnabled(): boolean {
      return adapter.getOpenAtLogin()
    },

    setEnabled(enabled: boolean): boolean {
      if (adapter.getOpenAtLogin() === enabled) return enabled
      adapter.setOpenAtLogin(enabled)
      return enabled
    },

    toggle(): boolean {
      const next = !adapter.getOpenAtLogin()
      adapter.setOpenAtLogin(next)
      return next
    },
  }
}
