import { useMemo } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const EVENT_COLOR_MAP = {
  blue: 'bg-blue-600',
  green: 'bg-green-600',
  red: 'bg-red-600',
  purple: 'bg-purple-600',
  orange: 'bg-orange-500',
  pink: 'bg-pink-600',
}

function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export default function CalendarGrid({ currentDate, events, selectedDate, onDayClick, onMonthChange, onAddEvent }) {
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const prevMonth = () => onMonthChange(new Date(year, month - 1, 1))
  const nextMonth = () => onMonthChange(new Date(year, month + 1, 1))
  const goToToday = () => {
    onMonthChange(new Date())
    onDayClick(toDateKey(new Date()))
  }

  // Build 42-cell grid
  const cells = useMemo(() => {
    const firstWeekday = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrev = new Date(year, month, 0).getDate()
    const result = []

    for (let i = firstWeekday - 1; i >= 0; i--) {
      result.push({ date: new Date(year, month - 1, daysInPrev - i), outside: true })
    }
    for (let d = 1; d <= daysInMonth; d++) {
      result.push({ date: new Date(year, month, d), outside: false })
    }
    const remaining = 42 - result.length
    for (let d = 1; d <= remaining; d++) {
      result.push({ date: new Date(year, month + 1, d), outside: true })
    }
    return result
  }, [year, month])

  // Group events by date key
  const eventsByDate = useMemo(() => {
    const map = {}
    events.forEach(ev => {
      if (!map[ev.date]) map[ev.date] = []
      map[ev.date].push(ev)
    })
    return map
  }, [events])

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">
            {MONTH_NAMES[month]} {year}
          </h2>
          <button
            onClick={goToToday}
            className="text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-2.5 py-1 rounded-md transition-colors"
          >
            Today
          </button>
        </div>
        <div className="flex gap-1">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 border-b border-gray-800 flex-shrink-0">
        {DAY_LABELS.map(d => (
          <div key={d} className="py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 flex-1">
        {cells.map(({ date, outside }, idx) => {
          const key = toDateKey(date)
          const dayEvents = eventsByDate[key] || []
          const isToday = isSameDay(date, today)
          const isSelected = selectedDate === key

          return (
            <div
              key={idx}
              onClick={() => onDayClick(key)}
              className={[
                'border-b border-r border-gray-800/50 p-1.5 cursor-pointer transition-colors group relative',
                outside ? 'opacity-25' : '',
                isSelected && !outside ? 'bg-blue-950/40' : !outside ? 'hover:bg-gray-800/40' : '',
              ].join(' ')}
            >
              {/* Date number */}
              <div className="flex items-start justify-between mb-1">
                <span
                  className={[
                    'text-sm w-7 h-7 flex items-center justify-center rounded-full font-medium select-none',
                    isToday
                      ? 'bg-blue-600 text-white'
                      : isSelected
                        ? 'bg-blue-800/60 text-blue-200'
                        : outside
                          ? 'text-gray-600'
                          : 'text-gray-300',
                  ].join(' ')}
                >
                  {date.getDate()}
                </span>

                {/* Quick add button on hover */}
                {!outside && (
                  <button
                    onClick={e => { e.stopPropagation(); onAddEvent(key) }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-700 text-gray-500 hover:text-gray-300 transition-all"
                  >
                    <Plus size={13} />
                  </button>
                )}
              </div>

              {/* Event pills */}
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map(ev => (
                  <div
                    key={ev.id}
                    className={`text-xs px-1.5 py-0.5 rounded text-white truncate leading-tight ${EVENT_COLOR_MAP[ev.color] || 'bg-blue-600'}`}
                  >
                    {ev.startTime && <span className="opacity-75 mr-1">{ev.startTime}</span>}
                    {ev.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500 px-1">+{dayEvents.length - 3} more</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
