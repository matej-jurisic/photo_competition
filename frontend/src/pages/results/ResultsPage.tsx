import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Trophy, ArrowLeft, Star, Gift } from 'lucide-react'
import { api } from '../../api/client'
import type { PhotographerScore } from '../../api/types'

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

  if (error || !results) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-red-500">Failed to load results.</p>
    </div>
  )

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

        {/* Overall winner / tie */}
        {(() => {
          const hasScores = results.topics.some(t => t.scores.some(s => s.totalRatings > 0))
          if (!hasScores) return null
          if (results.winner) return (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-6 mb-8 flex items-center gap-4">
              <Trophy size={36} className="text-amber-500 flex-shrink-0" />
              <div>
                <div className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Overall Winner</div>
                <div className="text-2xl font-bold text-gray-900">{results.winner.name}</div>
              </div>
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

            return (
              <div key={topicResult.topic.id} className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">{topicResult.topic.name}</h2>
                <div className="space-y-4">
                  {sorted.map((s: PhotographerScore, i) => {
                    const pct = topScore > 0 ? (s.averageScore / 10) * 100 : 0
                    const isWinner = i === 0 && s.averageScore > 0 && sorted.length > 1 && s.averageScore > sorted[1].averageScore

                    return (
                      <div key={s.photographer.id}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            {isWinner && <Trophy size={14} className="text-amber-500" />}
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
