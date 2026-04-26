export interface Contest {
  id: number
  name: string
  description: string | null
  rewards: string[]
  uploadEndDate: string
  ratingEndDate: string
  isCompleted: boolean
  createdAt: string
}

export interface ContestDetail extends Contest {
  photographers: PhotographerWithPhotos[]
  topics: Topic[]
  judges: Judge[]
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
}
