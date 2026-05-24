import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
    ArrowLeft,
    Award,
    Camera,
    ChevronLeft,
    ChevronRight,
    Gift,
    Lock,
    MessageSquare,
    Star,
    Trophy,
    UserCheck,
    Users,
    X,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { api } from "../../api/client";
import type { BadgedPhoto, Photo, PhotographerScore } from "../../api/types";

const BASE = import.meta.env.VITE_API_URL ?? "";

const RANK_BADGE = [
    "bg-amber-400 text-white",
    "bg-gray-400 text-white",
    "bg-amber-700 text-white",
];

function rankBadgeClass(idx: number) {
    return RANK_BADGE[idx] ?? "bg-white/80 text-gray-600";
}

function BadgeCarousel({ photos }: { photos: BadgedPhoto[] }) {
    const [index, setIndex] = useState(0);
    if (photos.length === 0) return null;

    const prev = () => setIndex((i) => (i - 1 + photos.length) % photos.length);
    const next = () => setIndex((i) => (i + 1) % photos.length);
    const current = photos[index];

    const badgeCounts = current.badges.reduce<Record<string, number>>(
        (acc, b) => {
            acc[b] = (acc[b] ?? 0) + 1;
            return acc;
        },
        {},
    );
    const uniqueBadges = Object.entries(badgeCounts);

    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
            <div className="px-6 pt-5 pb-3 flex items-center gap-2 border-b border-gray-100">
                <Award size={18} className="text-purple-500" />
                <h2 className="font-bold text-gray-900">Special Badges</h2>
                <span className="ml-auto text-sm text-gray-400">
                    {index + 1} / {photos.length}
                </span>
            </div>

            {/* Mobile: stacked */}
            <div className="sm:hidden">
                <img
                    src={`${BASE}${current.photo.imageUrl}`}
                    alt={current.photo.title ?? current.photographerName}
                    className="w-full h-52 object-cover"
                />
                <div className="px-5 pt-4 pb-2 flex flex-col gap-1.5 min-h-[9rem]">
                    <p className="font-semibold text-gray-900">
                        {current.photographerName}
                    </p>
                    <p className="text-xs text-gray-400">{current.topicName}</p>
                    {current.photo.title && (
                        <p className="text-sm text-gray-600 italic">
                            "{current.photo.title}"
                        </p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-1">
                        {uniqueBadges.map(([badge, count]) => (
                            <span
                                key={badge}
                                className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full font-medium"
                            >
                                <Award size={10} />
                                {badge}
                                {count > 1 && (
                                    <span className="text-purple-500">
                                        {count}×
                                    </span>
                                )}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="flex items-center justify-between px-3 py-3">
                    <button
                        onClick={prev}
                        disabled={photos.length <= 1}
                        className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-20"
                    >
                        <ChevronLeft size={22} />
                    </button>
                    {/* {photos.length > 1 && (
                        <div className="flex gap-1.5">
                            {photos.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setIndex(i)}
                                    className={`w-1.5 h-1.5 rounded-full transition-colors ${i === index ? "bg-purple-500" : "bg-gray-200"}`}
                                />
                            ))}
                        </div>
                    )} */}
                    <button
                        onClick={next}
                        disabled={photos.length <= 1}
                        className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-20"
                    >
                        <ChevronRight size={22} />
                    </button>
                </div>
            </div>

            {/* Desktop: side by side */}
            <div className="hidden sm:flex items-stretch">
                <button
                    onClick={prev}
                    disabled={photos.length <= 1}
                    className="px-3 text-gray-400 hover:text-gray-700 disabled:opacity-20 flex-shrink-0"
                >
                    <ChevronLeft size={22} />
                </button>
                <div className="flex-1 py-5 flex gap-5 items-start min-w-0">
                    <img
                        src={`${BASE}${current.photo.imageUrl}`}
                        alt={current.photo.title ?? current.photographerName}
                        className="w-40 h-28 object-cover rounded-xl flex-shrink-0"
                    />
                    <div className="min-w-0 flex flex-col gap-2 pt-1 min-h-[7rem]">
                        <p className="font-semibold text-gray-900 truncate">
                            {current.photographerName}
                        </p>
                        <p className="text-xs text-gray-400">
                            {current.topicName}
                        </p>
                        {current.photo.title && (
                            <p className="text-sm text-gray-600 italic truncate">
                                "{current.photo.title}"
                            </p>
                        )}
                        <div className="flex flex-wrap gap-1.5 mt-1">
                            {uniqueBadges.map(([badge, count]) => (
                                <span
                                    key={badge}
                                    className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full font-medium"
                                >
                                    <Award size={10} />
                                    {badge}
                                    {count > 1 && (
                                        <span className="text-purple-500 font-bold">
                                            {count}×
                                        </span>
                                    )}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
                <button
                    onClick={next}
                    disabled={photos.length <= 1}
                    className="px-3 text-gray-400 hover:text-gray-700 disabled:opacity-20 flex-shrink-0"
                >
                    <ChevronRight size={22} />
                </button>
            </div>
            {photos.length > 1 && (
                <div className="hidden sm:flex justify-center gap-1.5 pb-4">
                    {photos.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setIndex(i)}
                            className={`w-1.5 h-1.5 rounded-full transition-colors ${i === index ? "bg-purple-500" : "bg-gray-200"}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function Lightbox({ photo, onClose }: { photo: Photo; onClose: () => void }) {
    return (
        <div
            className="fixed inset-0 z-[1000] bg-black/90 flex items-center justify-center"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-[1001] text-white bg-black/50 hover:bg-black/70 w-10 h-10 rounded-full flex items-center justify-center"
            >
                <X size={18} />
            </button>
            <TransformWrapper initialScale={1} minScale={1} maxScale={4}>
                <TransformComponent
                    wrapperStyle={{ width: "100vw", height: "100vh" }}
                    contentStyle={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <img
                        src={`${BASE}${photo.imageUrl}`}
                        alt={photo.title ?? ""}
                        className="max-w-full max-h-full object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                </TransformComponent>
            </TransformWrapper>
        </div>
    );
}

export default function ResultsPage() {
    const { contestId } = useParams<{ contestId: string }>();
    const navigate = useNavigate();
    const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);

    const {
        data: results,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["results", contestId],
        queryFn: () => api.contests.results(Number(contestId)),
    });

    if (isLoading)
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-500">Loading results...</p>
            </div>
        );

    if (error) {
        const is401 =
            axios.isAxiosError(error) && error.response?.status === 401;
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                {is401 ? (
                    <div className="text-center">
                        <Lock
                            size={36}
                            className="mx-auto text-gray-300 mb-3"
                        />
                        <p className="text-gray-600 font-medium">
                            Results are not yet available.
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                            Check back after the rating period ends.
                        </p>
                    </div>
                ) : (
                    <p className="text-red-500">Failed to load results.</p>
                )}
            </div>
        );
    }

    if (!results) return null;

    const now = new Date();
    const uploadEnded = now > new Date(results.contest.uploadEndDate);
    const ratingEnded = now > new Date(results.contest.ratingEndDate);
    const hasAnyRatings = results.overallScores.some((s) => s.totalRatings > 0);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-6 py-8">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6"
                >
                    <ArrowLeft size={16} /> Back
                </button>

                <div className="flex items-center gap-3 mb-8">
                    <Trophy className="text-amber-500" size={28} />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {results.contest.name} Results
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {ratingEnded
                                ? "Contest ended"
                                : uploadEnded
                                  ? `Rating open · closes ${new Date(results.contest.ratingEndDate).toLocaleDateString("en-GB")}`
                                  : `Uploads until ${new Date(results.contest.uploadEndDate).toLocaleDateString("en-GB")}`}
                        </p>
                    </div>
                </div>

                {/* Stats bar */}
                {(() => {
                    const totalPhotos = results.topics.reduce(
                        (acc, t) =>
                            acc +
                            t.scores.reduce((a, s) => a + s.totalPhotos, 0),
                        0,
                    );
                    const participantCount = results.overallScores.length;
                    return (
                        <div className="flex items-center gap-0 rounded-2xl border border-gray-200 bg-white overflow-hidden mb-6 divide-x divide-gray-100">
                            <div className="flex-1 flex flex-col items-center py-4 gap-1">
                                <Users size={16} className="text-indigo-400" />
                                <span className="text-xl font-bold text-gray-900">
                                    {participantCount}
                                </span>
                                <span className="text-xs text-gray-400">
                                    Photographers
                                </span>
                            </div>
                            <div className="flex-1 flex flex-col items-center py-4 gap-1">
                                <Camera size={16} className="text-indigo-400" />
                                <span className="text-xl font-bold text-gray-900">
                                    {totalPhotos}
                                </span>
                                <span className="text-xs text-gray-400">
                                    Photos
                                </span>
                            </div>
                            <div className="flex-1 flex flex-col items-center py-4 gap-1">
                                <UserCheck
                                    size={16}
                                    className="text-indigo-400"
                                />
                                <span className="text-xl font-bold text-gray-900">
                                    {results.judgeCount}
                                </span>
                                <span className="text-xs text-gray-400">
                                    Judges
                                </span>
                            </div>
                        </div>
                    );
                })()}

                {/* Rewards */}
                {results.contest.rewards.length > 0 && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 mb-6 flex items-start gap-4">
                        <Gift
                            size={28}
                            className="text-indigo-500 flex-shrink-0 mt-0.5"
                        />
                        <div>
                            <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">
                                {results.contest.rewards.length === 1
                                    ? "Reward"
                                    : "Rewards"}
                            </div>
                            <ul className="space-y-1">
                                {results.contest.rewards.map((r, i) => (
                                    <li
                                        key={i}
                                        className="text-lg font-semibold text-indigo-900"
                                    >
                                        {r}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {/* Overall winner banner */}
                {hasAnyRatings &&
                    (() => {
                        if (results.winner)
                            return (
                                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-6 mb-6 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <Trophy
                                            size={36}
                                            className="text-amber-500 flex-shrink-0"
                                        />
                                        <div>
                                            <div className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">
                                                Overall Winner
                                            </div>
                                            <div className="text-2xl font-bold text-gray-900">
                                                {results.winner.name}
                                            </div>
                                        </div>
                                    </div>
                                    {results.winnerScore != null && (
                                        <div className="text-right flex-shrink-0">
                                            <div className="text-3xl font-bold text-amber-600">
                                                {results.winnerScore.toFixed(2)}
                                            </div>
                                            <div className="text-xs text-amber-500 font-medium mt-0.5 flex items-center justify-end gap-1">
                                                <Star
                                                    size={11}
                                                    fill="currentColor"
                                                />{" "}
                                                avg score
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        if (results.tiedPhotographers.length > 0)
                            return (
                                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-6 flex items-center gap-4">
                                    <Trophy
                                        size={36}
                                        className="text-gray-400 flex-shrink-0"
                                    />
                                    <div>
                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                            Overall Result — Tie
                                        </div>
                                        <div className="text-2xl font-bold text-gray-700">
                                            {results.tiedPhotographers
                                                .map((p) => p.name)
                                                .join(" · ")}
                                        </div>
                                    </div>
                                </div>
                            );
                        return null;
                    })()}

                {/* Overall ranking */}
                {results.overallScores.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                            <Trophy size={16} className="text-amber-500" />
                            <h2 className="font-bold text-gray-900">
                                Overall Ranking
                            </h2>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {results.overallScores.map(
                                (s: PhotographerScore, idx) => (
                                    <div
                                        key={s.photographer.id}
                                        className="flex items-center gap-4 px-6 py-3"
                                    >
                                        <span
                                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${rankBadgeClass(idx)}`}
                                        >
                                            {idx + 1}
                                        </span>
                                        <span className="flex-1 font-medium text-gray-800">
                                            {s.photographer.name}
                                        </span>
                                        <div className="flex items-center gap-1.5 text-sm">
                                            {s.totalRatings > 0 ? (
                                                <>
                                                    <span className="font-bold text-gray-900">
                                                        {s.averageScore.toFixed(
                                                            2,
                                                        )}
                                                    </span>
                                                    <Star
                                                        size={13}
                                                        className="text-amber-400"
                                                        fill="currentColor"
                                                    />
                                                    <span className="text-gray-400 text-xs">
                                                        ({s.totalRatings}{" "}
                                                        ratings)
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-gray-400 text-xs">
                                                    No ratings yet
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ),
                            )}
                        </div>
                    </div>
                )}

                {/* Badge carousel */}
                {results.badgedPhotos.length > 0 && (
                    <BadgeCarousel photos={results.badgedPhotos} />
                )}

                {/* Per-topic photo grids */}
                <div className="space-y-6">
                    {results.topics.map((topicResult) => {
                        const sorted = [...topicResult.scores]
                            .filter((s) => s.totalPhotos > 0)
                            .sort((a, b) => b.averageScore - a.averageScore);

                        if (sorted.length === 0) return null;

                        const topScore = sorted[0]?.averageScore ?? 0;

                        return (
                            <div
                                key={topicResult.topic.id}
                                className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
                            >
                                <div className="px-6 pt-6 pb-6">
                                    <h2 className="text-lg font-bold text-gray-900 mb-4">
                                        {topicResult.topic.name}
                                    </h2>
                                    {sorted.length >= 1 &&
                                        sorted[0].totalRatings > 0 &&
                                        (sorted.length === 1 ||
                                            sorted[0].averageScore >
                                                sorted[1].averageScore) && (
                                            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
                                                <Trophy
                                                    size={16}
                                                    className="text-amber-500 flex-shrink-0"
                                                />
                                                <span className="text-sm font-semibold text-amber-800">
                                                    {
                                                        sorted[0].photographer
                                                            .name
                                                    }{" "}
                                                    wins this topic
                                                </span>
                                                <span className="ml-auto text-sm font-bold text-amber-600 flex items-center gap-1">
                                                    {sorted[0].averageScore.toFixed(
                                                        2,
                                                    )}{" "}
                                                    <Star
                                                        size={11}
                                                        className="text-amber-400"
                                                        fill="currentColor"
                                                    />
                                                </span>
                                            </div>
                                        )}
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {sorted.map(
                                            (s: PhotographerScore, idx) => {
                                                const pct =
                                                    topScore > 0
                                                        ? (s.averageScore /
                                                              10) *
                                                          100
                                                        : 0;
                                                const isWinner =
                                                    idx === 0 &&
                                                    s.totalRatings > 0 &&
                                                    (sorted.length === 1 ||
                                                        s.averageScore >
                                                            sorted[1]
                                                                .averageScore);

                                                return (
                                                    <div
                                                        key={s.photographer.id}
                                                        className={`rounded-xl border overflow-hidden ${isWinner ? "border-amber-300" : "border-gray-200"}`}
                                                    >
                                                        {s.topPhoto ? (
                                                            <button
                                                                className="w-full aspect-[4/3] block relative overflow-hidden group"
                                                                onClick={() =>
                                                                    setLightboxPhoto(
                                                                        s.topPhoto!,
                                                                    )
                                                                }
                                                            >
                                                                <img
                                                                    src={`${BASE}${s.topPhoto.imageUrl}`}
                                                                    alt={
                                                                        s
                                                                            .topPhoto
                                                                            .title ??
                                                                        s
                                                                            .photographer
                                                                            .name
                                                                    }
                                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                                />
                                                                <div
                                                                    className={`absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow ${rankBadgeClass(idx)}`}
                                                                >
                                                                    {idx + 1}
                                                                </div>
                                                            </button>
                                                        ) : (
                                                            <div className="w-full aspect-[4/3] bg-gray-100 flex items-center justify-center relative">
                                                                <Trophy
                                                                    size={24}
                                                                    className="text-gray-300"
                                                                />
                                                                <div
                                                                    className={`absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow ${rankBadgeClass(idx)}`}
                                                                >
                                                                    {idx + 1}
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="p-3">
                                                            <div className="flex items-center gap-1 mb-1 min-w-0">
                                                                {isWinner && (
                                                                    <Trophy
                                                                        size={
                                                                            12
                                                                        }
                                                                        className="text-amber-500 flex-shrink-0"
                                                                    />
                                                                )}
                                                                <span className="font-medium text-sm text-gray-900 truncate">
                                                                    {
                                                                        s
                                                                            .photographer
                                                                            .name
                                                                    }
                                                                </span>
                                                            </div>
                                                            {s.totalRatings >
                                                            0 ? (
                                                                <div className="flex items-center gap-1 mb-2">
                                                                    <span className="text-sm font-bold text-gray-900">
                                                                        {s.averageScore.toFixed(
                                                                            2,
                                                                        )}
                                                                    </span>
                                                                    <Star
                                                                        size={
                                                                            12
                                                                        }
                                                                        className="text-amber-400"
                                                                        fill="currentColor"
                                                                    />
                                                                    <span className="text-xs text-gray-400">
                                                                        (
                                                                        {
                                                                            s.totalRatings
                                                                        }
                                                                        )
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-gray-400 block mb-2">
                                                                    No ratings
                                                                    yet
                                                                </span>
                                                            )}
                                                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full transition-all duration-500 ${isWinner ? "bg-amber-400" : "bg-indigo-400"}`}
                                                                    style={{
                                                                        width: `${pct}%`,
                                                                    }}
                                                                />
                                                            </div>
                                                            {s.comments.length >
                                                                0 && (
                                                                <div className="mt-2 space-y-1">
                                                                    {s.comments.map(
                                                                        (
                                                                            c,
                                                                            i,
                                                                        ) => (
                                                                            <p
                                                                                key={
                                                                                    i
                                                                                }
                                                                                className="text-xs text-gray-500 italic flex gap-1"
                                                                            >
                                                                                <MessageSquare
                                                                                    size={
                                                                                        10
                                                                                    }
                                                                                    className="text-gray-300 flex-shrink-0 mt-0.5"
                                                                                />
                                                                                <span className="line-clamp-5">
                                                                                    {
                                                                                        c
                                                                                    }
                                                                                </span>
                                                                            </p>
                                                                        ),
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            },
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {results.topics.length === 0 && (
                    <div className="text-center py-16 text-gray-400">
                        <p>No topics have been set up yet.</p>
                    </div>
                )}
            </div>

            {lightboxPhoto && (
                <Lightbox
                    photo={lightboxPhoto}
                    onClose={() => setLightboxPhoto(null)}
                />
            )}
        </div>
    );
}
