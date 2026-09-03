import { useEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent as ReactKeyboardEvent } from 'react'
import { CameraIcon, MenuIcon, SendIcon, SirenIcon } from '../components/icons'

const DEPARTMENTS = ['Alpha Base', 'Medical Center', 'Fire Station'] as const
type Department = (typeof DEPARTMENTS)[number]

export default function Home() {
  // Frontend report state: description + departments[] + veryUrgent.
  // These three are what the incident payload will be built from later.
  const [message, setMessage] = useState('')
  const [departments, setDepartments] = useState<Department[]>([])
  const [veryUrgent, setVeryUrgent] = useState(false)

  const [isTagOpen, setIsTagOpen] = useState(false)
  const [hasPhoto, setHasPhoto] = useState(false)

  const tagRef = useRef<HTMLDivElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const messageInputRef = useRef<HTMLTextAreaElement>(null)

  // Grow the reporting box to fit its content, capped so the send button and
  // the page centre stay visible. Reset when the report is sent.
  function resizeMessage() {
    const el = messageInputRef.current
    if (!el) return
    el.style.height = '0px'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  useEffect(resizeMessage, [message])

  useEffect(() => {
    if (!isTagOpen) return

    function handlePointerDown(event: PointerEvent) {
      if (!tagRef.current?.contains(event.target as Node)) setIsTagOpen(false)
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsTagOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isTagOpen])

  // Multi-select: a report may concern any combination of departments, so
  // tapping a selected one removes it rather than replacing the selection.
  function toggleDepartment(name: Department) {
    setDepartments((current) =>
      current.includes(name)
        ? current.filter((selected) => selected !== name)
        : [...current, name],
    )
  }

  // Prototype only: no API call, no upload, no location capture.
  function handleSend(event: FormEvent) {
    event.preventDefault()
    if (!message.trim()) return
    setMessage('')
    setDepartments([])
    setVeryUrgent(false)
    setHasPhoto(false)
    if (messageInputRef.current) messageInputRef.current.style.height = 'auto'
  }

  // Shift + Enter inserts a newline instead of submitting the report.
  function handleKeyDown(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend(event)
    }
  }

  // Keep the pill readable on narrow screens: name it when one department is
  // tagged, count them once there is more than one.
  const tagSummary =
    departments.length === 0
      ? null
      : departments.length === 1
        ? departments[0]
        : `${departments.length} departments`

  return (
    <main className="relative flex min-h-svh w-full flex-col bg-cream text-wine">
      {/* CENTRE — UER logo, anchored to the visual centre of the viewport */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span
          role="img"
          aria-label="UER"
          className="uer-logo-mark h-44 w-44"
          data-testid="uer-logo"
        />
      </div>

      {/* TOP — two standalone controls, no bar and no header */}
      <div className="relative flex items-start justify-between px-4 pt-[calc(1rem+env(safe-area-inset-top))]">
        <button
          type="button"
          aria-label="Menu"
          className="flex h-11 w-11 items-center justify-center rounded-full active:bg-wine/10"
        >
          <MenuIcon className="h-6 w-6" />
        </button>

        {/* Very Urgent — the badge spells the state out; the filled button
            alone would only read as "on" without saying what is on. */}
        <div className="flex items-center gap-2">
          {veryUrgent && (
            <span
              aria-hidden="true"
              className="rounded-full bg-wine px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-cream"
            >
              Very Urgent
            </span>
          )}

          <button
            type="button"
            aria-label="Mark report as very urgent"
            aria-pressed={veryUrgent}
            onClick={() => setVeryUrgent((urgent) => !urgent)}
            className={`flex h-11 w-11 items-center justify-center rounded-full border-2 ${
              veryUrgent
                ? 'border-wine bg-wine text-cream'
                : 'border-transparent text-wine active:bg-wine/10'
            }`}
          >
            <SirenIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className="flex-1" />

      {/* BOTTOM */}
      <div className="relative flex flex-col gap-3 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        {/* Department tagger — beside the reporting control, outside the input */}
        <div ref={tagRef} className="relative flex justify-end">
          {isTagOpen && (
            <div
              role="listbox"
              aria-label="Tag departments"
              aria-multiselectable="true"
              className="absolute bottom-full right-0 mb-2 w-44 rounded-2xl border-2 border-wine bg-cream p-1"
            >
              {DEPARTMENTS.map((name) => {
                const isSelected = departments.includes(name)
                return (
                  <button
                    key={name}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    // Stays open on purpose: closing here would force one
                    // reopen per department in a multi-select list.
                    onClick={() => toggleDepartment(name)}
                    className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium ${
                      isSelected
                        ? 'bg-wine text-cream'
                        : 'text-wine active:bg-wine/10'
                    }`}
                  >
                    <span>{name}</span>
                    {isSelected && <span aria-hidden="true">✓</span>}
                  </button>
                )
              })}
            </div>
          )}

          <button
            type="button"
            aria-label="Tag departments"
            aria-haspopup="listbox"
            aria-expanded={isTagOpen}
            onClick={() => setIsTagOpen((open) => !open)}
            className={`flex h-9 items-center gap-1.5 rounded-full border-2 border-wine px-3 text-sm font-semibold ${
              tagSummary ? 'bg-wine text-cream' : 'text-wine'
            }`}
          >
            <span aria-hidden="true">@</span>
            {tagSummary && <span>{tagSummary}</span>}
          </button>
        </div>

        {/* Reporting control — [ Camera ] [ Text Input ] [ Send ] */}
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(event) => setHasPhoto(event.target.files!.length > 0)}
          />

          <button
            type="button"
            aria-label="Attach incident photo"
            aria-pressed={hasPhoto}
            onClick={() => photoInputRef.current?.click()}
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-wine ${
              hasPhoto ? 'bg-wine text-cream' : 'text-wine'
            }`}
          >
            <CameraIcon className="h-6 w-6" />
          </button>

          <textarea
            ref={messageInputRef}
            rows={1}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="...Report an incident"
            aria-label="Report an incident"
            className="max-h-40 min-h-12 min-w-0 flex-1 resize-none overflow-y-auto rounded-3xl border-2 border-wine bg-cream px-4 py-3 text-base text-wine outline-none placeholder:text-wine/50 focus:border-wine-dark"
          />

          <button
            type="submit"
            aria-label="Send report"
            disabled={!message.trim()}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-wine text-cream disabled:opacity-40"
          >
            <SendIcon className="h-5 w-5" />
          </button>
        </form>
      </div>
    </main>
  )
}
