export interface Contest {
  id: number
  name: string
  description: string | null
  reward: string | null
  uploadEndDate: string
  ratingEndDate: string
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

export interface JudgeSession {
  judge: Judge
  contest: ContestDetail
  existingRatings: Rating[]
}

export interface PhotographerScore {
  photographer: Photographer
  averageScore: number
  totalRatings: number
  totalPhotos: number
}

export interface TopicResult {
  topic: Topic
  scores: PhotographerScore[]
}

export interface ContestResults {
  contest: Contest
  topics: TopicResult[]
  winner: Photographer | null
}
