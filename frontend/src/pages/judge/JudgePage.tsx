import { useMutation, useQuery } from "@tanstack/react-query";
import {
    AlertTriangle,
    Award,
    Camera,
    CheckCircle,
    Gift,
    Star,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { api } from "../../api/client";
import type { Photo, Topic } from "../../api/types";

interface LocalRating {
    photoId: number;
    score: number;
    comment: string;
}

function seededShuffle<T>(arr: T[], seed: string): T[] {
    let hash = 0
    for (let i = 0; i < seed.length; i++) {
        hash = Math.imul(hash ^ seed.charCodeAt(i), 0x9e3779b9)
        hash ^= hash >>> 16
    }
    const result = [...arr]
    for (let i = result.length - 1; i > 0; i--) {
        hash = Math.imul(hash ^ (hash >>> 15), 0x85ebca77)
        hash ^= hash >>> 13
        hash = Math.imul(hash, 0xc2b2ae35)
        hash ^= hash >>> 16
        const j = Math.abs(hash) % (i + 1);
        [result[i], result[j]] = [result[j], result[i]]
    }
    return result
}

export default function JudgePage() {
    const { token } = useParams<{ token: string }>();
    const [ratings, setRatings] = useState<Record<number, LocalRating>>({});
    // photoId -> badgeName (at most one badge per photo, at most 3 total)
    const [badges, setBadges] = useState<Record<number, string>>({});
    const [saved, setSaved] = useState(false);
    const [selectedImage, setSelectedImage] = useState<Photo | undefined>();

    const {
        data: session,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["session", token],
        queryFn: () => api.session.get(token!),
        enabled: !!token,
    });

    useEffect(() => {
        if (session?.existingRatings) {
            const init: Record<number, LocalRating> = {};
            for (const r of session.existingRatings) {
                init[r.photoId] = {
                    photoId: r.photoId,
                    score: r.score,
                    comment: r.comment ?? "",
                };
            }
            setRatings(init);
        }
        if (session?.existingBadges) {
            const init: Record<number, string> = {};
            for (const b of session.existingBadges) {
                init[b.photoId] = b.badgeName;
            }
            setBadges(init);
        }
    }, [session]);

    useEffect(() => {
        if (selectedImage) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }

        return () => {
            document.body.style.overflow = "unset";
        };
    }, [selectedImage]);

    const submit = useMutation({
        mutationFn: async () => {
            const ratingsList = Object.values(ratings);
            const badgesList = Object.entries(badges).map(
                ([photoId, badgeName]) => ({
                    photoId: Number(photoId),
                    badgeName,
                }),
            );
            await api.session.submitBadges(token!, badgesList);
            return api.session.submitRatings(
                token!,
                ratingsList.map((r) => ({ ...r, comment: r.comment })),
            );
        },
        onSuccess: () => {
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        },
    });

    if (isLoading)
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-500">Loading your rating session...</p>
            </div>
        );

    if (error || !session)
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle
                        size={40}
                        className="mx-auto text-amber-400 mb-3"
                    />
                    <p className="text-gray-700 font-medium">
                        Invalid or expired judge link.
                    </p>
                </div>
            </div>
        );

    const contest = session.contest;
    const now = new Date();
    const isNotYetOpen = !contest.isUploadClosed && now < new Date(contest.uploadEndDate);
    const isEnded =
        contest.isCompleted || now > new Date(contest.ratingEndDate);
    const BASE = import.meta.env.VITE_API_URL ?? "";

    const totalPhotos = contest.photographers.reduce(
        (s, p) => s + p.photos.length,
        0,
    );
    const ratedCount = Object.keys(ratings).length;
    const badgeCount = Object.keys(badges).length;
    const totalBadgesAllowed = contest.badges.reduce((s, b) => s + b.allowedCount, 0);

    function setRating(photoId: number, score: number, comment: string) {
        setRatings((prev) => ({
            ...prev,
            [photoId]: { photoId, score, comment },
        }));
    }

    function toggleBadge(photoId: number, badgeName: string) {
        setBadges((prev) => {
            const current = prev[photoId];
            if (current === badgeName) {
                const next = { ...prev };
                delete next[photoId];
                return next;
            }
            const config = contest.badges.find(b => b.name === badgeName);
            if (!config) return prev;
            // Count uses of this badge on other photos
            const usedElsewhere = Object.entries(prev).filter(
                ([pid, bn]) => bn === badgeName && Number(pid) !== photoId
            ).length;
            if (usedElsewhere >= config.allowedCount) return prev;
            return { ...prev, [photoId]: badgeName };
        });
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Camera className="text-indigo-600" size={22} />
                        <div>
                            <h1 className="font-bold text-gray-900">
                                {contest.name}
                            </h1>
                            <p className="text-xs text-gray-500">
                                Judge: {session.judge.name}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">
                            {ratedCount}/{totalPhotos} rated
                        </span>
                        {totalBadgesAllowed > 0 && (
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                                <Award size={14} className="text-indigo-400" />
                                {badgeCount}/{totalBadgesAllowed} badges
                            </span>
                        )}
                        {!isEnded && !isNotYetOpen && (
                            <button
                                onClick={() => submit.mutate()}
                                disabled={submit.isPending || ratedCount === 0}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    saved
                                        ? "bg-green-600 text-white"
                                        : "bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                                }`}
                            >
                                {saved ? (
                                    <>
                                        <CheckCircle size={15} /> Saved!
                                    </>
                                ) : submit.isPending ? (
                                    "Saving..."
                                ) : (
                                    "Save Ratings"
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8">
                {isNotYetOpen && (
                    <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-4 text-sm">
                        Rating opens after the upload deadline on{" "}
                        {new Date(contest.uploadEndDate).toLocaleDateString(
                            "en-GB",
                        )}
                        .
                    </div>
                )}

                {isEnded && (
                    <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-sm">
                        This contest has ended. Ratings are now closed.
                    </div>
                )}

                {contest.rewards.length > 0 && (
                    <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start gap-3">
                        <Gift
                            size={18}
                            className="text-indigo-500 flex-shrink-0 mt-0.5"
                        />
                        <div>
                            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
                                {contest.rewards.length === 1
                                    ? "Reward"
                                    : "Rewards"}
                            </span>
                            <ul className="mt-0.5 space-y-0.5">
                                {contest.rewards.map((r, i) => (
                                    <li
                                        key={i}
                                        className="text-sm text-indigo-900"
                                    >
                                        {r}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {!isEnded && !isNotYetOpen && contest.badges.length > 0 && (
                    <div className="mb-6 bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
                        <Award
                            size={18}
                            className="text-purple-500 flex-shrink-0 mt-0.5"
                        />
                        <div>
                            <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">
                                Special Badges
                            </span>
                            <ul className="mt-1 space-y-0.5">
                                {contest.badges.map(b => {
                                    const used = Object.values(badges).filter(bn => bn === b.name).length;
                                    return (
                                        <li key={b.name} className="text-sm text-purple-900 flex items-center gap-1.5">
                                            <Award size={11} className="text-purple-400 flex-shrink-0" />
                                            <span><strong>{b.name}</strong> — {used}/{b.allowedCount} used</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>
                )}

                {contest.topics.map((topic: Topic) => {
                    return (
                        <div key={topic.id} className="mb-10">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>
                                {topic.name}
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {seededShuffle(
                                    contest.photographers.flatMap(p =>
                                        p.photos.filter(ph => ph.topicId === topic.id)
                                    ),
                                    session.judge.token + topic.id
                                ).map((photo) => {
                                    const r = ratings[photo.id];
                                    const assignedBadge = badges[photo.id];

                                    return (
                                        <div key={photo.id} className="bg-white rounded-xl border border-gray-200 p-4">
                                            <div
                                                className="w-full aspect-[4/3] rounded-lg overflow-hidden flex items-center justify-center"
                                                onClick={() => setSelectedImage(photo)}
                                            >
                                                <img
                                                    src={`${BASE}${photo.imageUrl}`}
                                                    alt={photo.title ?? ""}
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                            {photo.title && (
                                                <p className="text-xs text-gray-500 mt-1">{photo.title}</p>
                                            )}
                                            <div className="mt-3">
                                                <div className="flex items-center gap-1 mb-2">
                                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => (
                                                        <button
                                                            key={score}
                                                            disabled={isEnded || isNotYetOpen}
                                                            onClick={() => setRating(photo.id, score, r?.comment ?? "")}
                                                            className={`w-7 h-7 rounded text-xs font-medium transition-colors disabled:cursor-not-allowed ${
                                                                r?.score === score
                                                                    ? "bg-indigo-600 text-white"
                                                                    : r?.score && score <= r.score
                                                                      ? "bg-indigo-100 text-indigo-700"
                                                                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                            }`}
                                                        >
                                                            {score}
                                                        </button>
                                                    ))}
                                                </div>
                                                <input
                                                    type="text"
                                                    disabled={isEnded || isNotYetOpen}
                                                    placeholder="Comment (optional)"
                                                    value={r?.comment ?? ""}
                                                    onChange={e => setRating(photo.id, r?.score ?? 0, e.target.value)}
                                                    className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-gray-50 disabled:text-gray-400 mb-2"
                                                />
                                                {contest.badges.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                                        {contest.badges.map(b => {
                                                            const isSelected = assignedBadge === b.name;
                                                            const usedElsewhere = Object.entries(badges).filter(
                                                                ([pid, bn]) => bn === b.name && Number(pid) !== photo.id
                                                            ).length;
                                                            const isDisabled = isEnded || isNotYetOpen || (!isSelected && usedElsewhere >= b.allowedCount);
                                                            return (
                                                                <button
                                                                    key={b.name}
                                                                    disabled={isDisabled}
                                                                    onClick={() => toggleBadge(photo.id, b.name)}
                                                                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                                                                        isSelected
                                                                            ? "bg-purple-600 text-white border-purple-600"
                                                                            : "border-gray-200 text-gray-500 hover:border-purple-400 hover:text-purple-600"
                                                                    }`}
                                                                >
                                                                    <Award size={10} />
                                                                    {b.name}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}

                {!isEnded && !isNotYetOpen && ratedCount > 0 && (
                    <div className="fixed bottom-6 right-6">
                        <button
                            onClick={() => submit.mutate()}
                            disabled={submit.isPending}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium shadow-lg transition-colors ${
                                saved
                                    ? "bg-green-600 text-white"
                                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                            }`}
                        >
                            {saved ? (
                                <>
                                    <CheckCircle size={16} /> Saved!
                                </>
                            ) : (
                                <>
                                    <Star size={16} /> Save Ratings (
                                    {ratedCount}/{totalPhotos})
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
            {selectedImage && (
                <div className="fixed inset-0 z-[1000] bg-black/90 flex items-center justify-center">
                    {/* Close Button */}
                    <button
                        onClick={() => setSelectedImage(undefined)}
                        className="absolute top-4 right-4 z-[1001] text-white bg-black/50 hover:bg-black/70 w-10 h-10 rounded-full flex items-center justify-center leading-none"
                    >
                        ✕
                    </button>
                    <TransformWrapper
                        initialScale={1}
                        minScale={1}
                        maxScale={4}
                    >
                        <TransformComponent
                            wrapperStyle={{ width: "100%", height: "100%" }}
                            contentStyle={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <img
                                src={`${BASE}${selectedImage.imageUrl}`}
                                alt={selectedImage.title ?? ""}
                                className="max-w-full max-h-full object-contain"
                            />
                        </TransformComponent>
                    </TransformWrapper>
                </div>
            )}
        </div>
    );
}
