import { useState, useEffect } from 'react'
import { X, Calendar, Clock, MapPin, AlignLeft } from 'lucide-react'

const COLORS = [
  { id: 'blue',   cls: 'bg-blue-500' },
  { id: 'green',  cls: 'bg-green-500' },
  { id: 'red',    cls: 'bg-red-500' },
  { id: 'purple', cls: 'bg-purple-500' },
  { id: 'orange', cls: 'bg-orange-500' },
  { id: 'pink',   cls: 'bg-pink-500' },
]

const BLANK = { title: '', date: '', startTime: '', endTime: '', location: '', description: '', color: 'blue' }

export default function AddEventModal({ isOpen, onClose, onSave, initialDate, editEvent }) {
  const [form, setForm] = useState(BLANK)

  useEffect(() => {
    if (!isOpen) return
    if (editEvent) {
      setForm({
        title: editEvent.title || '',
        date: editEvent.date || '',
        startTime: editEvent.startTime || '',
        endTime: editEvent.endTime || '',
        location: editEvent.location || '',
        description: editEvent.description || '',
        color: editEvent.color || 'blue',
      })
    } else {
      setForm({ ...BLANK, date: initialDate || '' })
    }
  }, [isOpen, editEvent, initialDate])

  if (!isOpen) return null

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = e => {
    e.preventDefault()
    if (!form.title.trim() || !form.date) return
    onSave({ ...form, title: form.title.trim() })
  }

  return (
    // On mobile: slide up from bottom. On desktop: centered.
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex flex-col justify-end sm:justify-center sm:items-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border-t sm:border border-gray-700 w-full sm:max-w-md sm:rounded-xl shadow-2xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle on mobile */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-700 rounded-full" />
        </div>

        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
          <h2 className="font-semibold text-white">{editEvent ? 'Edit Event' : 'New Event'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* Title */}
          <input
            type="text"
            placeholder="Event title *"
            value={form.title}
            onChange={set('title')}
            required
            autoFocus
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors text-sm"
          />

          {/* Date */}
          <div className="flex items-center gap-3">
            <Calendar size={15} className="text-gray-500 flex-shrink-0" />
            <input
              type="date"
              value={form.date}
              onChange={set('date')}
              required
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
            />
          </div>

          {/* Time range */}
          <div className="flex items-center gap-3">
            <Clock size={15} className="text-gray-500 flex-shrink-0" />
            <div className="flex items-center gap-2 flex-1">
              <input
                type="time"
                value={form.startTime}
                onChange={set('startTime')}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
              />
              <span className="text-gray-600 text-sm">–</span>
              <input
                type="time"
                value={form.endTime}
                onChange={set('endTime')}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
              />
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-3">
            <MapPin size={15} className="text-gray-500 flex-shrink-0" />
            <input
              type="text"
              placeholder="Location"
              value={form.location}
              onChange={set('location')}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors text-sm"
            />
          </div>

          {/* Description */}
          <div className="flex items-start gap-3">
            <AlignLeft size={15} className="text-gray-500 flex-shrink-0 mt-2.5" />
            <textarea
              placeholder="Description"
              value={form.description}
              onChange={set('description')}
              rows={2}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none text-sm"
            />
          </div>

          {/* Color picker */}
          <div className="flex items-center gap-3">
            <div className={`w-3.5 h-3.5 rounded-full flex-shrink-0 ${COLORS.find(c => c.id === form.color)?.cls || 'bg-blue-500'}`} />
            <div className="flex gap-3">
              {COLORS.map(({ id, cls }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, color: id }))}
                  className={`w-7 h-7 rounded-full ${cls} transition-transform hover:scale-110 ${
                    form.color === id ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110' : ''
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-1 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-3 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg text-sm font-medium transition-colors"
            >
              {editEvent ? 'Save Changes' : 'Add Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
