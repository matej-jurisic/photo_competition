export interface Contest {
  id: number
  name: string
  description: string | null
  rewards: string[]
  uploadEndDate: string
  ratingEndDate: string
  isCompleted: boolean
  isUploadClosed: boolean
  createdAt: string
  ownerId: number | null
}

export interface ContestBadge {
  id: number
  name: string
  allowedCount: number
}

export interface ContestDetail extends Contest {
  photographers: PhotographerWithPhotos[]
  topics: Topic[]
  judges: Judge[]
  badges: ContestBadge[]
}

export interface Photographer {
  id: number
  name: string
  bio: string | null
  contestId: number
  token: string
}

export interface PhotographerWithPhotos extends Photographer {
  photos: Photo[]
}

export interface PhotographerSession {
  photographer: PhotographerWithPhotos
  contest: Contest
  topics: Topic[]
}

export interface Topic {
  id: number
  name: string
  contestId: number
  orderIndex: number
}

export interface Photo {
  id: number
  title: string | null
  imageUrl: string
  photographerId: number
  topicId: number
}

export interface Judge {
  id: number
  name: string
  email: string | null
  token: string
  contestId: number
  createdAt: string
}

export interface Rating {
  id: number
  photoId: number
  score: number
  comment: string | null
  createdAt: string
}

export interface Badge {
  id: number
  judgeId: number
  photoId: number
  badgeName: string
}

export interface JudgeSession {
  judge: Judge
  contest: ContestDetail
  existingRatings: Rating[]
  existingBadges: Badge[]
}

export interface PhotographerScore {
  photographer: Photographer
  averageScore: number
  totalRatings: number
  totalPhotos: number
  topPhoto: Photo | null
  comments: string[]
}

export interface TopicResult {
  topic: Topic
  scores: PhotographerScore[]
}

export interface BadgedPhoto {
  photo: Photo
  photographerName: string
  topicName: string
  badges: string[]
}

export interface ContestResults {
  contest: Contest
  topics: TopicResult[]
  winner: Photographer | null
  winnerScore: number | null
  tiedPhotographers: Photographer[]
  badgedPhotos: BadgedPhoto[]
  overallScores: PhotographerScore[]
  judgeCount: number
}

// Auth
export interface AuthResult {
  token: string
  userId: number
  username: string
  displayName: string
}

// Browse (public, no tokens)
export interface ContestPublic {
  id: number
  name: string
  description: string | null
  uploadEndDate: string
  ratingEndDate: string
  createdAt: string
  isCompleted: boolean
  isUploadClosed: boolean
  ownerDisplayName: string | null
  photographerCount: number
  judgeCount: number
  topics: Topic[]
}

// Join requests
export type JoinRole = 'Photographer' | 'Judge'
export type JoinRequestStatus = 'Pending' | 'Accepted' | 'Rejected'

export interface JoinRequest {
  id: number
  contestId: number
  contestName: string
  requesterDisplayName: string
  role: JoinRole
  status: JoinRequestStatus
  message: string | null
  createdAt: string
  reviewedAt: string | null
}

export interface UserSummary {
  id: number
  username: string
  displayName: string
}

// Dashboard
export interface MyContestEntry {
  contest: Contest
  role: JoinRole
}

export interface OwnedContestSummary {
  contest: Contest
  pendingRequestCount: number
}
