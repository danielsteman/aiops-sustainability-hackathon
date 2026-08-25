/**
 * Feature-detect support for the File System Access API. The persistence
 * feature depends on it, so unsupported browsers get a full-page notice
 * instead of a silently-degraded app.
 */
export function supportsFileSystemAccess(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.showOpenFilePicker === 'function'
  )
}

export const SUPPORT_NOTICE_HEADING = 'This app needs a Chromium browser'
export const SUPPORT_NOTICE_BODY =
  'LCA Compare writes your changes straight back to your JSON file, which requires the File System Access API. Open it in Chrome, Edge, Brave or Opera.'

/**
 * Full-page notice rendered on browsers without the File System Access API.
 * White card, hard shadow, no red, a 33px heading and a single line of body
 * copy. The app does not partially work here.
 */
export function BrowserSupportNotice() {
  return (
    <main
      className="flex min-h-screen items-center justify-center p-6"
      style={{ background: 'var(--colors-bg)' }}
    >
      <div
        className="max-w-md rounded-lg border border-black bg-white p-8"
        style={{ boxShadow: '8px 8px 0 0 rgba(0,0,0,0.15)' }}
      >
        <h1
          className="mb-3 font-semibold leading-tight"
          style={{ fontSize: '33px', color: 'var(--colors-text)' }}
        >
          {SUPPORT_NOTICE_HEADING}
        </h1>
        <p
          className="text-base leading-relaxed"
          style={{ color: 'var(--colors-text)' }}
        >
          {SUPPORT_NOTICE_BODY}
        </p>
      </div>
    </main>
  )
}
