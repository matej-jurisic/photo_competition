import axios from 'axios'
import type {
  Contest, ContestDetail, Photographer, PhotographerWithPhotos,
  Topic, Photo, Judge, Rating, JudgeSession, ContestResults
} from './types'

const BASE = import.meta.env.VITE_API_URL ?? ''

const http = axios.create({ baseURL: BASE })

// Admin key is stored in sessionStorage so it persists for the browser session
export function getAdminKey(): string {
  return sessionStorage.getItem('adminKey') ?? ''
}

export function setAdminKey(key: string) {
  sessionStorage.setItem('adminKey', key)
}

const adminHeaders = () => ({ 'X-Admin-Key': getAdminKey() })

// ── Contests ──────────────────────────────────────────────────────────────────
export const api = {
  contests: {
    list: () => http.get<Contest[]>('/api/contests', { headers: adminHeaders() }).then(r => r.data),
    get: (id: number) => http.get<ContestDetail>(`/api/contests/${id}`, { headers: adminHeaders() }).then(r => r.data),
    create: (data: { name: string; description: string; endDate: string }) =>
      http.post<Contest>('/api/contests', data, { headers: adminHeaders() }).then(r => r.data),
    update: (id: number, data: { name: string; description: string; endDate: string }) =>
      http.put<Contest>(`/api/contests/${id}`, data, { headers: adminHeaders() }).then(r => r.data),
    delete: (id: number) =>
      http.delete(`/api/contests/${id}`, { headers: adminHeaders() }),
    results: (id: number) =>
      http.get<ContestResults>(`/api/contests/${id}/results`).then(r => r.data),
  },

  photographers: {
    list: (contestId: number) =>
      http.get<PhotographerWithPhotos[]>(`/api/contests/${contestId}/photographers`, { headers: adminHeaders() }).then(r => r.data),
    create: (contestId: number, data: { name: string; bio: string }) =>
      http.post<Photographer>(`/api/contests/${contestId}/photographers`, data, { headers: adminHeaders() }).then(r => r.data),
    update: (id: number, data: { name: string; bio: string }) =>
      http.put<Photographer>(`/api/photographers/${id}`, data, { headers: adminHeaders() }).then(r => r.data),
    delete: (id: number) =>
      http.delete(`/api/photographers/${id}`, { headers: adminHeaders() }),
  },

  topics: {
    list: (contestId: number) =>
      http.get<Topic[]>(`/api/contests/${contestId}/topics`, { headers: adminHeaders() }).then(r => r.data),
    create: (contestId: number, data: { name: string; orderIndex: number }) =>
      http.post<Topic>(`/api/contests/${contestId}/topics`, data, { headers: adminHeaders() }).then(r => r.data),
    update: (id: number, data: { name: string; orderIndex: number }) =>
      http.put<Topic>(`/api/topics/${id}`, data, { headers: adminHeaders() }).then(r => r.data),
    delete: (id: number) =>
      http.delete(`/api/topics/${id}`, { headers: adminHeaders() }),
  },

  photos: {
    upload: (data: FormData) =>
      http.post<Photo>('/api/photos', data, { headers: { ...adminHeaders(), 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
    delete: (id: number) =>
      http.delete(`/api/photos/${id}`, { headers: adminHeaders() }),
  },

  judges: {
    list: (contestId: number) =>
      http.get<Judge[]>(`/api/contests/${contestId}/judges`, { headers: adminHeaders() }).then(r => r.data),
    create: (contestId: number, data: { name: string; email: string }) =>
      http.post<Judge>(`/api/contests/${contestId}/judges`, data, { headers: adminHeaders() }).then(r => r.data),
    update: (id: number, data: { name: string; email: string }) =>
      http.put<Judge>(`/api/judges/${id}`, data, { headers: adminHeaders() }).then(r => r.data),
    delete: (id: number) =>
      http.delete(`/api/judges/${id}`, { headers: adminHeaders() }),
    link: (id: number) =>
      http.get<{ link: string }>(`/api/judges/${id}/link`, { headers: adminHeaders() }).then(r => r.data),
  },

  session: {
    get: (token: string) =>
      http.get<JudgeSession>(`/api/sessions/${token}`).then(r => r.data),
    submitRatings: (token: string, ratings: { photoId: number; score: number; comment: string }[]) =>
      http.post<Rating[]>(`/api/sessions/${token}/ratings`, { ratings }).then(r => r.data),
  },
}
