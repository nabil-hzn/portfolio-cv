import { useState, useEffect } from 'react'
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy,
} from 'firebase/firestore'
import { db } from './firebase'
import CalendarGrid from './CalendarGrid'
import EventSidebar from './EventSidebar'
import AddEventModal from './AddEventModal'
import { CalendarDays, List, Plus } from 'lucide-react'

const EVENTS_COL = 'events'

function isConfigured() {
  try {
    return db && db.app.options.projectId !== 'REPLACE_ME'
  } catch {
    return false
  }
}

const STORAGE_KEY = 'calendar-events-local'

const SAMPLE_EVENTS = [
  {
    id: 's1', title: 'Team Standup', date: '2026-08-04',
    startTime: '09:00', endTime: '09:30', location: 'Zoom',
    description: 'Daily team sync meeting', color: 'blue',
  },
  {
    id: 's2', title: 'Data Pipeline Review', date: '2026-08-06',
    startTime: '14:00', endTime: '15:00', location: 'Conference Room A',
    description: 'Review Q3 data pipeline performance and bottlenecks', color: 'purple',
  },
  {
    id: 's3', title: 'Sprint Planning', date: '2026-08-10',
    startTime: '10:00', endTime: '12:00', location: 'Google Meet',
    description: 'Plan tasks for the next two-week sprint', color: 'green',
  },
  {
    id: 's4', title: 'SQL Workshop', date: '2026-08-13',
    startTime: '13:00', endTime: '14:30', location: 'Training Room',
    description: 'Advanced SQL for analytics — window functions & CTEs', color: 'orange',
  },
  {
    id: 's5', title: 'Dashboard Demo', date: '2026-08-18',
    startTime: '15:00', endTime: '16:00', location: 'Client Office',
    description: 'Present the new BI dashboard to stakeholders', color: 'pink',
  },
  {
    id: 's6', title: 'Monthly 1-on-1', date: '2026-08-20',
    startTime: '09:00', endTime: '09:45', location: "Manager's Office",
    description: '', color: 'blue',
  },
  {
    id: 's7', title: 'Team Outing', date: '2026-08-22',
    startTime: '', endTime: '', location: 'Grand Indonesia',
    description: 'Quarterly team bonding event', color: 'red',
  },
  {
    id: 's8', title: 'Airflow Migration', date: '2026-08-28',
    startTime: '08:00', endTime: '17:00', location: '',
    description: 'Migrate all DAGs to Airflow 2.9', color: 'purple',
  },
]

export default function CalendarApp() {
  const configured = isConfigured()

  const [localEvents, setLocalEvents] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : SAMPLE_EVENTS
    } catch {
      return SAMPLE_EVENTS
    }
  })

  const [firestoreEvents, setFirestoreEvents] = useState(null)
  const [fsError, setFsError] = useState(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [modalInitialDate, setModalInitialDate] = useState(null)
  // Mobile: 'calendar' | 'events'
  const [mobileView, setMobileView] = useState('calendar')

  useEffect(() => {
    if (!configured) localStorage.setItem(STORAGE_KEY, JSON.stringify(localEvents))
  }, [localEvents, configured])

  useEffect(() => {
    if (!configured) return
    const q = query(collection(db, EVENTS_COL), orderBy('date'))
    const unsub = onSnapshot(q,
      snap => { setFirestoreEvents(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setFsError(null) },
      err => { console.error(err); setFsError(err.message) },
    )
    return () => unsub()
  }, [configured])

  const events = configured ? (firestoreEvents ?? []) : localEvents
  const loading = configured && firestoreEvents === null && !fsError

  const addEvent = async data => {
    if (configured) await addDoc(collection(db, EVENTS_COL), data)
    else setLocalEvents(prev => [...prev, { ...data, id: Date.now().toString() }])
  }

  const updateEvent = async updated => {
    if (configured) { const { id, ...rest } = updated; await updateDoc(doc(db, EVENTS_COL, id), rest) }
    else setLocalEvents(prev => prev.map(e => e.id === updated.id ? updated : e))
  }

  const deleteEvent = async id => {
    if (configured) await deleteDoc(doc(db, EVENTS_COL, id))
    else setLocalEvents(prev => prev.filter(e => e.id !== id))
  }

  const openAddModal = (date = null) => {
    setModalInitialDate(date || selectedDate)
    setEditingEvent(null)
    setIsModalOpen(true)
  }

  const openEditModal = event => { setEditingEvent(event); setIsModalOpen(true) }

  const handleSave = async data => {
    if (editingEvent) await updateEvent({ ...data, id: editingEvent.id })
    else await addEvent(data)
    setIsModalOpen(false)
    setEditingEvent(null)
  }

  const handleDayClick = date => {
    setSelectedDate(date)
    setMobileView('events') // auto-switch to events on mobile when a day is tapped
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <h1 className="text-base font-bold text-white tracking-tight">Calendar</h1>
          {configured
            ? <span className="text-xs text-green-400 border border-green-800 bg-green-950/50 px-2 py-0.5 rounded-full hidden sm:inline">● Cloud sync</span>
            : <span className="text-xs text-gray-500 border border-gray-700 px-2 py-0.5 rounded-full hidden sm:inline">Local only</span>
          }
        </div>
        <button
          onClick={() => openAddModal()}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={15} />
          <span className="hidden sm:inline">Add Event</span>
          <span className="sm:hidden">Add</span>
        </button>
      </header>

      {fsError && (
        <div className="bg-red-900/40 border-b border-red-800 text-red-300 text-xs px-4 py-2 text-center">
          Firestore error: {fsError}
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading events…
          </div>
        </div>
      ) : (
        <>
          {/* Main content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Calendar grid — full width on mobile (hidden when events tab active) */}
            <div className={`flex-1 p-3 sm:p-5 overflow-auto min-w-0 ${mobileView === 'events' ? 'hidden lg:block' : 'block'}`}>
              <CalendarGrid
                currentDate={currentDate}
                events={events}
                selectedDate={selectedDate}
                onDayClick={handleDayClick}
                onMonthChange={setCurrentDate}
                onAddEvent={openAddModal}
              />
            </div>

            {/* Sidebar — full width on mobile (hidden when calendar tab active) */}
            <div className={`
              w-full lg:w-80 flex-shrink-0
              border-t lg:border-t-0 lg:border-l border-gray-800
              flex flex-col overflow-hidden
              ${mobileView === 'calendar' ? 'hidden lg:flex' : 'flex'}
            `}>
              <EventSidebar
                events={events}
                selectedDate={selectedDate}
                onAddEvent={openAddModal}
                onDeleteEvent={deleteEvent}
                onEditEvent={openEditModal}
                onClearSelection={() => setSelectedDate(null)}
              />
            </div>
          </div>

          {/* Mobile bottom tab bar */}
          <nav className="lg:hidden flex border-t border-gray-800 bg-gray-900 flex-shrink-0">
            <button
              onClick={() => setMobileView('calendar')}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                mobileView === 'calendar' ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <CalendarDays size={20} />
              Calendar
            </button>
            <button
              onClick={() => setMobileView('events')}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                mobileView === 'events' ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <List size={20} />
              Events
              {events.length > 0 && (
                <span className="absolute mt-0 ml-6 bg-blue-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center leading-none">
                  {events.length > 9 ? '9+' : events.length}
                </span>
              )}
            </button>
          </nav>
        </>
      )}

      <AddEventModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingEvent(null) }}
        onSave={handleSave}
        initialDate={modalInitialDate}
        editEvent={editingEvent}
      />
    </div>
  )
}
