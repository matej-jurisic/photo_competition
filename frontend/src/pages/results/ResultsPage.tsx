import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Trophy, ArrowLeft, Star, Gift, Lock } from 'lucide-react'
import axios from 'axios'
import { api } from '../../api/client'
import type { PhotographerScore } from '../../api/types'

const BASE = import.meta.env.VITE_API_URL ?? ''

export default function ResultsPage() {
  const { contestId } = useParams<{ contestId: string }>()

  const { data: results, isLoading, error } = useQuery({
    queryKey: ['results', contestId],
    queryFn: () => api.contests.results(Number(contestId)),
  })

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500">Loading results...</p>
    </div>
  )

  if (error) {
    const is401 = axios.isAxiosError(error) && error.response?.status === 401
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        {is401 ? (
          <div className="text-center">
            <Lock size={36} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600 font-medium">Results are not yet available.</p>
            <p className="text-sm text-gray-400 mt-1">Check back after the rating period ends.</p>
          </div>
        ) : (
          <p className="text-red-500">Failed to load results.</p>
        )}
      </div>
    )
  }

  if (!results) return null

  const now = new Date()
  const uploadEnded = now > new Date(results.contest.uploadEndDate)
  const ratingEnded = now > new Date(results.contest.ratingEndDate)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Link to="/admin" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6">
          <ArrowLeft size={16} /> Admin
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <Trophy className="text-amber-500" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{results.contest.name} — Results</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {ratingEnded
                ? 'Contest ended'
                : uploadEnded
                  ? `Rating open · closes ${new Date(results.contest.ratingEndDate).toLocaleDateString()}`
                  : `Uploads until ${new Date(results.contest.uploadEndDate).toLocaleDateString()}`}
            </p>
          </div>
        </div>

        {/* Reward */}
        {results.contest.reward && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 mb-6 flex items-center gap-4">
            <Gift size={28} className="text-indigo-500 flex-shrink-0" />
            <div>
              <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">Reward</div>
              <div className="text-lg font-semibold text-indigo-900">{results.contest.reward}</div>
            </div>
          </div>
        )}

        {/* Overall winner */}
        {(() => {
          const hasScores = results.topics.some(t => t.scores.some(s => s.totalRatings > 0))
          if (!hasScores) return null
          if (results.winner) return (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-6 mb-8 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Trophy size={36} className="text-amber-500 flex-shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Overall Winner</div>
                  <div className="text-2xl font-bold text-gray-900">{results.winner.name}</div>
                </div>
              </div>
              {results.winnerScore != null && (
                <div className="text-right flex-shrink-0">
                  <div className="text-3xl font-bold text-amber-600">{results.winnerScore.toFixed(2)}</div>
                  <div className="text-xs text-amber-500 font-medium mt-0.5 flex items-center justify-end gap-1">
                    <Star size={11} fill="currentColor" /> avg score
                  </div>
                </div>
              )}
            </div>
          )
          return (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-8 flex items-center gap-4">
              <Trophy size={36} className="text-gray-400 flex-shrink-0" />
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Overall Result</div>
                <div className="text-2xl font-bold text-gray-700">Tie</div>
              </div>
            </div>
          )
        })()}

        {/* Per-topic results */}
        <div className="space-y-6">
          {results.topics.map(topicResult => {
            const sorted = [...topicResult.scores].sort((a, b) => b.averageScore - a.averageScore)
            const topScore = sorted[0]?.averageScore ?? 0
            const winner = sorted[0]
            const isWinner = (s: PhotographerScore) =>
              s.photographer.id === winner?.photographer.id &&
              winner.averageScore > 0 &&
              (sorted.length === 1 || winner.averageScore > sorted[1].averageScore)

            return (
              <div key={topicResult.topic.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-6 pt-6 pb-4">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">{topicResult.topic.name}</h2>

                  {/* Category winner spotlight */}
                  {winner && isWinner(winner) && (
                    <div className="flex gap-4 mb-5 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                      {winner.topPhoto ? (
                        <img
                          src={`${BASE}${winner.topPhoto.imageUrl}`}
                          alt={winner.topPhoto.title ?? winner.photographer.name}
                          className="w-32 h-24 object-cover rounded-lg flex-shrink-0"
                        />
                      ) : (
                        <div className="w-32 h-24 bg-amber-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                          <Trophy size={24} className="text-amber-300" />
                        </div>
                      )}
                      <div className="flex flex-col justify-center min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Trophy size={14} className="text-amber-500 flex-shrink-0" />
                          <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Category Winner</span>
                        </div>
                        <div className="font-bold text-gray-900 text-lg truncate">{winner.photographer.name}</div>
                      </div>
                    </div>
                  )}

                  {/* Full ranking */}
                  <div className="space-y-4">
                    {sorted.map((s: PhotographerScore) => {
                      const pct = topScore > 0 ? (s.averageScore / 10) * 100 : 0
                      const isCategoryWinner = isWinner(s)

                      return (
                        <div key={s.photographer.id}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              {isCategoryWinner && <Trophy size={14} className="text-amber-500" />}
                              <span className="font-medium text-gray-800">{s.photographer.name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              {s.totalRatings > 0 ? (
                                <>
                                  <span className="font-bold text-gray-900">{s.averageScore.toFixed(2)}</span>
                                  <Star size={13} className="text-amber-400" fill="currentColor" />
                                  <span className="text-gray-400">({s.totalRatings} ratings)</span>
                                </>
                              ) : (
                                <span className="text-gray-400 text-xs">No ratings yet</span>
                              )}
                            </div>
                          </div>
                          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {results.topics.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p>No topics have been set up yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
