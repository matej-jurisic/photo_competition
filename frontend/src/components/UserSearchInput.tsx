import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X, User } from 'lucide-react'
import { api } from '../api/client'
import type { UserSummary } from '../api/types'

interface Props {
  selected: UserSummary | null
  onSelect: (user: UserSummary | null) => void
  placeholder?: string
}

export default function UserSearchInput({ selected, onSelect, placeholder = 'Search users...' }: Props) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(id)
  }, [search])

  const { data: results } = useQuery({
    queryKey: ['adminUserSearch', debouncedSearch],
    queryFn: () => api.admin.searchUsers(debouncedSearch),
    enabled: debouncedSearch.length >= 2,
    staleTime: 30_000,
  })

  if (selected) {
    return (
      <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 rounded-lg px-2.5 py-1.5 text-sm">
        <User size={13} className="text-indigo-500 flex-shrink-0" />
        <span className="text-indigo-700 font-medium">{selected.displayName}</span>
        <span className="text-indigo-400 text-xs">@{selected.username}</span>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="ml-auto text-indigo-400 hover:text-indigo-600 pl-1"
        >
          <X size={13} />
        </button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        placeholder={placeholder}
        value={search}
        onChange={e => { setSearch(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
      />
      {open && debouncedSearch.length >= 2 && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {results && results.length > 0 ? results.map(u => (
            <button
              key={u.id}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 flex flex-col"
              onMouseDown={e => e.preventDefault()}
              onClick={() => { onSelect(u); setSearch(''); setOpen(false) }}
            >
              <span className="font-medium text-gray-900">{u.displayName}</span>
              <span className="text-xs text-gray-400">@{u.username}</span>
            </button>
          )) : (
            <p className="px-3 py-2 text-sm text-gray-400">No users found</p>
          )}
        </div>
      )}
    </div>
  )
}
