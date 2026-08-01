import { Calendar, MapPin, Clock, ExternalLink, Trash2, Edit2, Plus, X } from 'lucide-react'

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const COLOR_DOT = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
  pink: 'bg-pink-500',
}

function getToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function parseDateStr(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function isPast(dateStr) {
  return parseDateStr(dateStr) < getToday()
}

function relativeLabel(dateStr) {
  const date = parseDateStr(dateStr)
  const today = getToday()
  const diff = Math.round((date - today) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  if (diff > 1 && diff < 7) return `In ${diff} days`
  if (diff < 0 && diff > -7) return `${Math.abs(diff)} days ago`
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${MONTH_SHORT[m - 1]} ${d}, ${y}`
}

function buildGCalUrl(ev) {
  const [y, m, d] = ev.date.split('-').map(Number)
  let startStr, endStr

  if (ev.startTime) {
    const [sh, sm] = ev.startTime.split(':').map(Number)
    const start = new Date(y, m - 1, d, sh, sm)
    startStr = toGCalDateTime(start)
    if (ev.endTime) {
      const [eh, em] = ev.endTime.split(':').map(Number)
      endStr = toGCalDateTime(new Date(y, m - 1, d, eh, em))
    } else {
      endStr = toGCalDateTime(new Date(start.getTime() + 3600000))
    }
  } else {
    // All-day
    startStr = `${y}${String(m).padStart(2,'0')}${String(d).padStart(2,'0')}`
    const next = new Date(y, m - 1, d + 1)
    endStr = `${next.getFullYear()}${String(next.getMonth()+1).padStart(2,'0')}${String(next.getDate()).padStart(2,'0')}`
  }

  const params = new URLSearchParams({ action: 'TEMPLATE', text: ev.title, dates: `${startStr}/${endStr}` })
  if (ev.description) params.set('details', ev.description)
  if (ev.location) params.set('location', ev.location)
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function toGCalDateTime(date) {
  return date.toISOString().replace(/[-:]/g, '').slice(0, 15) + '00Z'
}

function sortEvents(events) {
  const today = getToday()
  return [...events].sort((a, b) => {
    const aDate = parseDateStr(a.date)
    const bDate = parseDateStr(b.date)
    const aPast = aDate < today
    const bPast = bDate < today

    if (!aPast && bPast) return -1
    if (aPast && !bPast) return 1
    if (!aPast && !bPast) return aDate - bDate
    return bDate - aDate // both past: most recent first
  })
}

export default function EventSidebar({ events, selectedDate, onAddEvent, onDeleteEvent, onEditEvent, onClearSelection }) {
  const sorted = sortEvents(events)
  const displayed = selectedDate ? sorted.filter(e => e.date === selectedDate) : sorted

  const sidebarTitle = selectedDate
    ? (() => {
        const [y, m, d] = selectedDate.split('-').map(Number)
        return `${MONTH_SHORT[m-1]} ${d}, ${y}`
      })()
    : 'Upcoming Events'

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-800 flex-shrink-0 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-white text-sm">{sidebarTitle}</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {displayed.length} event{displayed.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {selectedDate && (
            <button
              onClick={onClearSelection}
              title="Show all events"
              className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors text-gray-500 hover:text-gray-300"
            >
              <X size={15} />
            </button>
          )}
          <button
            onClick={() => onAddEvent(selectedDate)}
            title="Add event"
            className="p-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors text-white"
          >
            <Plus size={15} />
          </button>
        </div>
      </div>

      {/* Event list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar size={36} className="text-gray-700 mb-3" />
            <p className="text-gray-500 text-sm">No events</p>
            <button
              onClick={() => onAddEvent(selectedDate)}
              className="mt-2 text-blue-400 hover:text-blue-300 text-xs transition-colors"
            >
              + Add event
            </button>
          </div>
        ) : (
          displayed.map(ev => {
            const past = isPast(ev.date)
            return (
              <div
                key={ev.id}
                className={`rounded-lg border p-3 transition-colors ${
                  past
                    ? 'border-gray-800 bg-gray-900/30 opacity-55'
                    : 'border-gray-700/70 bg-gray-900 hover:border-gray-600'
                }`}
              >
                <div className="flex gap-2.5">
                  {/* Color indicator */}
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${COLOR_DOT[ev.color] || 'bg-blue-500'}`} />

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-white leading-snug">{ev.title}</h3>

                    <div className="mt-1.5 space-y-0.5">
                      {/* Date */}
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Calendar size={11} className="flex-shrink-0" />
                        <span>{relativeLabel(ev.date)}</span>
                        {past && <span className="text-gray-600 text-xs">· past</span>}
                      </div>

                      {/* Time */}
                      {ev.startTime && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Clock size={11} className="flex-shrink-0" />
                          <span>
                            {ev.startTime}
                            {ev.endTime ? ` – ${ev.endTime}` : ''}
                          </span>
                        </div>
                      )}

                      {/* Location */}
                      {ev.location && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <MapPin size={11} className="flex-shrink-0" />
                          <span className="truncate">{ev.location}</span>
                        </div>
                      )}

                      {/* Description snippet */}
                      {ev.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                          {ev.description}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center mt-2.5 gap-2">
                      <a
                        href={buildGCalUrl(ev)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <ExternalLink size={11} />
                        Google Calendar
                      </a>
                      <div className="ml-auto flex gap-0.5">
                        <button
                          onClick={() => onEditEvent(ev)}
                          className="p-1.5 hover:bg-gray-700/70 rounded transition-colors text-gray-600 hover:text-gray-300"
                          title="Edit"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => onDeleteEvent(ev.id)}
                          className="p-1.5 hover:bg-red-900/30 rounded transition-colors text-gray-600 hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
