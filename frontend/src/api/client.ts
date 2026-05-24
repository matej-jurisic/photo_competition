import axios from 'axios'
import type {
  Contest, ContestDetail, Photographer, PhotographerWithPhotos,
  Topic, Photo, Judge, Rating, Badge, JudgeSession, ContestResults,
  AuthResult, ContestPublic, JoinRequest, JoinRole, MyContestEntry, OwnedContestSummary, UserSummary
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

export function clearAdminKey() {
  sessionStorage.removeItem('adminKey')
}

const adminHeaders = () => ({ 'X-Admin-Key': getAdminKey() })

function authHeaders(): Record<string, string> {
  try {
    const stored = localStorage.getItem('authUser')
    if (!stored) return {}
    const user = JSON.parse(stored)
    return user?.token ? { Authorization: `Bearer ${user.token}` } : {}
  } catch {
    return {}
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const api = {
  auth: {
    register: (data: { username: string; displayName: string; password: string }) =>
      http.post<AuthResult>('/api/auth/register', data).then(r => r.data),
    login: (data: { username: string; password: string }) =>
      http.post<AuthResult>('/api/auth/login', data).then(r => r.data),
    me: () =>
      http.get<AuthResult>('/api/auth/me', { headers: authHeaders() }).then(r => r.data),
  },

  // ── Browse (public) ─────────────────────────────────────────────────────────
  browse: {
    listContests: () =>
      http.get<ContestPublic[]>('/api/browse/contests').then(r => r.data),
    getContest: (id: number) =>
      http.get<ContestPublic>(`/api/browse/contests/${id}`).then(r => r.data),
  },

  // ── Join requests ───────────────────────────────────────────────────────────
  joinRequests: {
    create: (contestId: number, data: { role: JoinRole; message?: string }) =>
      http.post<JoinRequest>(`/api/contests/${contestId}/join-requests`, data, { headers: authHeaders() }).then(r => r.data),
    listForContest: (contestId: number) =>
      http.get<JoinRequest[]>(`/api/contests/${contestId}/join-requests`, { headers: { ...adminHeaders(), ...authHeaders() } }).then(r => r.data),
    accept: (requestId: number) =>
      http.patch(`/api/join-requests/${requestId}/accept`, {}, { headers: { ...adminHeaders(), ...authHeaders() } }),
    reject: (requestId: number) =>
      http.patch(`/api/join-requests/${requestId}/reject`, {}, { headers: { ...adminHeaders(), ...authHeaders() } }),
    myRequests: () =>
      http.get<JoinRequest[]>('/api/users/me/join-requests', { headers: authHeaders() }).then(r => r.data),
  },

  // ── User dashboard ──────────────────────────────────────────────────────────
  dashboard: {
    ownedContests: () =>
      http.get<OwnedContestSummary[]>('/api/users/me/owned-contests', { headers: authHeaders() }).then(r => r.data),
    myContests: () =>
      http.get<MyContestEntry[]>('/api/users/me/contests', { headers: authHeaders() }).then(r => r.data),
  },

  // ── User sessions (JWT-based) ────────────────────────────────────────────────
  userSession: {
    getJudgeSession: (contestId: number) =>
      http.get<JudgeSession>(`/api/user-sessions/judge/${contestId}`, { headers: authHeaders() }).then(r => r.data),
    getPhotographerSession: (contestId: number) =>
      http.get<import('./types').PhotographerSession>(`/api/user-sessions/photographer/${contestId}`, { headers: authHeaders() }).then(r => r.data),
  },

  // ── Admin utilities ──────────────────────────────────────────────────────────
  admin: {
    searchUsers: (search: string) =>
      http.get<UserSummary[]>('/api/admin/users', { params: { search }, headers: adminHeaders() }).then(r => r.data),
  },

  // ── Contests (admin) ─────────────────────────────────────────────────────────
  contests: {
    list: () => http.get<Contest[]>('/api/contests', { headers: adminHeaders() }).then(r => r.data),
    get: (id: number) => http.get<ContestDetail>(`/api/contests/${id}`, { headers: adminHeaders() }).then(r => r.data),
    create: (data: { name: string; description: string; uploadEndDate: string; ratingEndDate: string; rewards: string[]; badges: { name: string; allowedCount: number }[]; isPublic: boolean }) =>
      http.post<Contest>('/api/contests', data, { headers: { ...adminHeaders(), ...authHeaders() } }).then(r => r.data),
    update: (id: number, data: { name: string; description: string; uploadEndDate: string; ratingEndDate: string; rewards: string[]; badges: { name: string; allowedCount: number }[]; isPublic: boolean }) =>
      http.put<Contest>(`/api/contests/${id}`, data, { headers: { ...adminHeaders(), ...authHeaders() } }).then(r => r.data),
    delete: (id: number) =>
      http.delete(`/api/contests/${id}`, { headers: adminHeaders() }),
    results: (id: number) =>
      http.get<ContestResults>(`/api/contests/${id}/results`, { headers: adminHeaders() }).then(r => r.data),
    setComplete: (id: number, isCompleted: boolean) =>
      http.patch<Contest>(`/api/contests/${id}/complete`, { isCompleted }, { headers: { ...adminHeaders(), ...authHeaders() } }).then(r => r.data),
    setUploadClosed: (id: number, isUploadClosed: boolean) =>
      http.patch<Contest>(`/api/contests/${id}/close-uploads`, { isUploadClosed }, { headers: { ...adminHeaders(), ...authHeaders() } }).then(r => r.data),
  },

  photographers: {
    list: (contestId: number) =>
      http.get<PhotographerWithPhotos[]>(`/api/contests/${contestId}/photographers`, { headers: { ...adminHeaders(), ...authHeaders() } }).then(r => r.data),
    create: (contestId: number, data: { name: string; bio: string; userId?: number }) =>
      http.post<Photographer>(`/api/contests/${contestId}/photographers`, data, { headers: { ...adminHeaders(), ...authHeaders() } }).then(r => r.data),
    update: (id: number, data: { name: string; bio: string }) =>
      http.put<Photographer>(`/api/photographers/${id}`, data, { headers: adminHeaders() }).then(r => r.data),
    delete: (id: number) =>
      http.delete(`/api/photographers/${id}`, { headers: adminHeaders() }),
  },

  topics: {
    list: (contestId: number) =>
      http.get<Topic[]>(`/api/contests/${contestId}/topics`, { headers: { ...adminHeaders(), ...authHeaders() } }).then(r => r.data),
    create: (contestId: number, data: { name: string; orderIndex: number }) =>
      http.post<Topic>(`/api/contests/${contestId}/topics`, data, { headers: { ...adminHeaders(), ...authHeaders() } }).then(r => r.data),
    update: (id: number, data: { name: string; orderIndex: number }) =>
      http.put<Topic>(`/api/topics/${id}`, data, { headers: { ...adminHeaders(), ...authHeaders() } }).then(r => r.data),
    delete: (id: number) =>
      http.delete(`/api/topics/${id}`, { headers: { ...adminHeaders(), ...authHeaders() } }),
  },

  photos: {
    upload: (data: FormData) =>
      http.post<Photo>('/api/photos', data, { headers: { ...adminHeaders(), 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
    delete: (id: number) =>
      http.delete(`/api/photos/${id}`, { headers: adminHeaders() }),
  },

  judges: {
    list: (contestId: number) =>
      http.get<Judge[]>(`/api/contests/${contestId}/judges`, { headers: { ...adminHeaders(), ...authHeaders() } }).then(r => r.data),
    create: (contestId: number, data: { name: string; email: string; userId?: number }) =>
      http.post<Judge>(`/api/contests/${contestId}/judges`, data, { headers: { ...adminHeaders(), ...authHeaders() } }).then(r => r.data),
    update: (id: number, data: { name: string; email: string }) =>
      http.put<Judge>(`/api/judges/${id}`, data, { headers: adminHeaders() }).then(r => r.data),
    delete: (id: number) =>
      http.delete(`/api/judges/${id}`, { headers: adminHeaders() }),
    link: (id: number) =>
      http.get<{ link: string }>(`/api/judges/${id}/link`, { headers: { ...adminHeaders(), ...authHeaders() } }).then(r => r.data),
  },

  session: {
    get: (token: string) =>
      http.get<JudgeSession>(`/api/sessions/${token}`).then(r => r.data),
    submitRatings: (token: string, ratings: { photoId: number; score: number; comment: string }[]) =>
      http.post<Rating[]>(`/api/sessions/${token}/ratings`, { ratings }).then(r => r.data),
    submitBadges: (token: string, badges: { photoId: number; badgeName: string }[]) =>
      http.post<Badge[]>(`/api/sessions/${token}/badges`, { badges }).then(r => r.data),
  },

  photographerSession: {
    get: (token: string) =>
      http.get<import('./types').PhotographerSession>(`/api/photographer-sessions/${token}`).then(r => r.data),
    upload: (token: string, data: FormData) =>
      http.post<Photo>(`/api/photographer-sessions/${token}/photos`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then(r => r.data),
    deletePhoto: (token: string, photoId: number) =>
      http.delete(`/api/photographer-sessions/${token}/photos/${photoId}`),
    competitors: (token: string) =>
      http.get<string[]>(`/api/photographer-sessions/${token}/competitors`).then(r => r.data),
  },
}
