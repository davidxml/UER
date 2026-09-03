import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CameraIcon,
  MenuIcon,
  SendIcon,
  ShieldIcon,
  SirenIcon,
} from '../components/icons'
import { useIncidents } from '../context/IncidentContext'

const DEPARTMENTS = ['Alpha Base', 'Medical Center', 'Fire Station'] as const
type Department = (typeof DEPARTMENTS)[number]

const MAX_ATTACHMENTS = 4
const MAX_INPUT_HEIGHT = 120

export default function Home() {
  const [message, setMessage] = useState('')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [selectedDepts, setSelectedDepts] = useState<Department[]>([])
  const [attachments, setAttachments] = useState<string[]>([])
  const navigate = useNavigate()
  const { submitIncident } = useIncidents()

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Grow the reporting box to fit its content, capped so the send button and
  // the page centre stay visible. No scrollbar: the box resizes instead.
  const resizeInput = () => {
    const el = inputRef.current
    if (!el) return
    el.style.height = '0px'
    el.style.height = `${Math.min(el.scrollHeight, MAX_INPUT_HEIGHT)}px`
  }

  useEffect(resizeInput, [message])

  const toggleDepartment = (dept: Department) => {
    setSelectedDepts((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept],
    )
  }

  const getTagLabel = () => {
    if (selectedDepts.length === 0) return '@'
    if (selectedDepts.length === 1) return `@ ${selectedDepts[0]}`
    return `@ ${selectedDepts.length} departments`
  }

  function handleFiles(files: FileList | null) {
    if (!files) return
    const chosen = Array.from(files)
    if (chosen.length === 0) return

    void Promise.all(
      chosen.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = () => reject(new Error('Could not read image'))
            reader.readAsDataURL(file)
          }),
      ),
    )
      .then((urls) => {
        setAttachments((prev) => [...prev, ...urls].slice(0, MAX_ATTACHMENTS))
      })
      .catch(() => {
        // Ignore unreadable files; the report can still be sent without them.
      })
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSendReport = () => {
    if (!message.trim()) return

    const tagged =
      selectedDepts.length > 0 ? selectedDepts.join(', ') : 'General Dispatch'

    submitIncident({
      text: message.trim(),
      tagged,
      images: attachments,
    })
    setMessage('')
    setSelectedDepts([])
    setAttachments([])
    setIsMenuOpen(false)
    // Reset the file input so the same file can be picked again next time.
    if (fileInputRef.current) fileInputRef.current.value = ''
    // Auto-advance to the live tracking view of the new report.
    navigate('/tracking', { replace: true })
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Shift + Enter inserts a newline; plain Enter sends the report.
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSendReport()
    }
  }

  return (
    <main className="flex h-screen flex-col bg-surface-white">
      {/* HEADER */}
      <header className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          aria-label="Menu"
          onClick={() => navigate('/submissions')}
          className="flex h-11 w-11 items-center justify-center rounded-full"
        >
          <MenuIcon className="h-6 w-6 text-unilag-maroon" />
        </button>

        <button
          type="button"
          aria-label="Alert"
          className="flex h-11 w-11 items-center justify-center rounded-full"
        >
          <SirenIcon className="h-6 w-6 text-status-danger" />
        </button>
      </header>

      {/* MAIN — central crest */}
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <ShieldIcon className="h-24 w-24 text-unilag-maroon" />
      </div>

      {/* BOTTOM INPUT AREA */}
      <div className="flex flex-col gap-2 border-t border-gray-100 bg-surface-white p-4">
        {/* Tag pill */}
        <div className="relative flex justify-end">
          {isMenuOpen && (
            <div className="absolute bottom-full right-0 mb-2 flex w-48 flex-col overflow-hidden rounded-xl border border-unilag-maroon bg-surface-white shadow-lg">
              {DEPARTMENTS.map((dept) => {
                const isSelected = selectedDepts.includes(dept)
                return (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => toggleDepartment(dept)}
                    className={`px-4 py-2.5 text-left text-sm ${
                      isSelected
                        ? 'bg-unilag-maroon text-surface-white'
                        : 'text-ink-main hover:bg-surface-gray'
                    }`}
                  >
                    {dept}
                  </button>
                )
              })}
            </div>
          )}

          <button
            type="button"
            aria-label="Tag"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`cursor-pointer rounded-full bg-unilag-maroon px-3 py-1 text-sm font-bold text-white shadow-md transition-all duration-300 ${
              selectedDepts.length === 1 ? 'min-w-40' : ''
            }`}
          >
            {getTagLabel()}
          </button>
        </div>

        {/* Attached images */}
        {attachments.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap">
            {attachments.map((src, index) => (
              <div
                key={src}
                className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-200 sm:h-20 sm:w-20"
              >
                <img
                  src={src}
                  alt={`Attachment ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  aria-label={`Remove attachment ${index + 1}`}
                  onClick={() => removeAttachment(index)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink-main/70 text-xs font-bold text-surface-white"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Chat bar: [Camera] [input] [Send] */}
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => handleFiles(event.target.files)}
          />

          <button
            type="button"
            aria-label="Attach photo"
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer rounded-full border border-unilag-maroon p-2 text-unilag-maroon"
          >
            <CameraIcon className="h-6 w-6" />
          </button>

          <textarea
            ref={inputRef}
            rows={1}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="...Report an incident"
            aria-label="Report an incident"
            className="max-h-30 min-h-[52px] flex-1 resize-none overflow-y-hidden rounded-3xl border border-gray-300 bg-surface-gray px-4 py-3 text-ink-main outline-none placeholder:text-ink-muted focus:border-unilag-maroon focus:ring-1 focus:ring-unilag-maroon"
            style={{ height: '52px' }}
          />

          <button
            type="button"
            aria-label="Send"
            onClick={handleSendReport}
            disabled={!message.trim()}
            className="cursor-pointer rounded-full bg-unilag-maroon p-3 text-white disabled:opacity-40"
          >
            <SendIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </main>
  )
}
