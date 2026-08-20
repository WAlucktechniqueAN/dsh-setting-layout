// dsh-settings-layout — host (node) half.
//
// The browser half (lib/client.js) owns the settings panel layout entirely:
// the "面板布局" settings page, the live CSS overrides, and the window-like
// drag/resize handlers. This node half is a minimal host row so the bundle
// mounts in the web profile roster; it contributes nothing on the host.
export const name = 'dsh-settings-layout'
export const inject = []

export function apply() {
  // No host-side behavior. The browser half registers the settings section
  // and drives the panel geometry from the page.
}
