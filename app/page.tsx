"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useVisitor } from "@/hooks/use-visitor";
import { VotingCard } from "@/components/voting/voting-card";
import { useState, useCallback, useEffect } from "react";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { Header } from "@/components/header";
import { Captcha } from "@/components/captcha";
import Image from "next/image";
import { Progress } from "@/components/ui/progress";

// Preload an image and return a promise
function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

export default function Home() {
  const {
    visitorToken,
    isLoading: visitorLoading,
    totalVotes,
    verified,
    verify,
  } = useVisitor();
  const [isVoting, setIsVoting] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadedThumbnails, setLoadedThumbnails] = useState<{
    left: { id: Id<"thumbnails">; url: string | null; name: string };
    right: { id: Id<"thumbnails">; url: string | null; name: string };
  } | null>(null);

  const thumbnails = useQuery(
    api.thumbnails.getTwoRandomThumbnails,
    visitorToken && verified ? { visitorId: visitorToken } : "skip"
  );
  const castVote = useMutation(api.votes.castVote);
  const favoriteData = useQuery(
    api.votes.getVisitorFavorite,
    visitorToken && thumbnails === null ? { visitorId: visitorToken } : "skip"
  );

  // Preload images when thumbnails change
  useEffect(() => {
    if (!thumbnails) {
      setImagesLoaded(false);
      setLoadedThumbnails(null);
      return;
    }

    const leftUrl = thumbnails.left.url;
    const rightUrl = thumbnails.right.url;

    if (!leftUrl || !rightUrl) {
      setImagesLoaded(true);
      setLoadedThumbnails(thumbnails);
      return;
    }

    setImagesLoaded(false);

    Promise.all([preloadImage(leftUrl), preloadImage(rightUrl)])
      .then(() => {
        setLoadedThumbnails(thumbnails);
        setImagesLoaded(true);
      })
      .catch((err) => {
        console.error("Failed to preload images:", err);
        setLoadedThumbnails(thumbnails);
        setImagesLoaded(true);
      });
  }, [thumbnails]);

  const handleVote = useCallback(
    async (winnerId: Id<"thumbnails">, loserId: Id<"thumbnails">) => {
      if (!visitorToken || isVoting) return;

      setIsVoting(true);
      setImagesLoaded(false);
      try {
        await castVote({
          visitorId: visitorToken,
          winnerId,
          loserId,
        });
      } catch (error) {
        console.error("Vote failed:", error);
        setImagesLoaded(true);
      } finally {
        setIsVoting(false);
      }
    },
    [visitorToken, castVote, isVoting]
  );

  // Loading state - show skeleton
  if (visitorLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto p-4 md:p-8">
          <div className="text-center mb-8">
            <div className="h-8 w-80 bg-muted rounded mx-auto mb-2 animate-pulse" />
            <div className="h-5 w-64 bg-muted rounded mx-auto animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-w-4xl mx-auto">
            <VotingCardSkeleton />
            <VotingCardSkeleton />
          </div>
        </main>
      </div>
    );
  }

  // CAPTCHA verification required
  if (!verified) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <Captcha onVerify={verify} />
        </main>
      </div>
    );
  }

  // All combinations voted
  if (thumbnails === null) {
    // Get algorithm label based on score
    const getAlgorithmLabel = (score: number) => {
      if (score >= 90) return { label: "Génie", emoji: "🧠" };
      if (score >= 70) return { label: "Expert", emoji: "🎯" };
      if (score >= 50) return { label: "Amateur", emoji: "🤔" };
      if (score >= 30) return { label: "Débutant", emoji: "😅" };
      return { label: "Idiot", emoji: "🤡" };
    };

    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto p-4 md:p-8">
          <div className="max-w-lg mx-auto text-center">
            <h2 className="text-2xl font-bold mb-2">
              Tu as voté sur toutes les combinaisons !
            </h2>
            <p className="text-muted-foreground mb-8">
              Merci pour ta participation.
            </p>

            {favoriteData && favoriteData.favorite.url && (
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Ta miniature préférée
                  </p>
                  <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-primary">
                    <Image
                      src={favoriteData.favorite.url}
                      alt="Ta miniature préférée"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    #{favoriteData.favorite.rank} au classement • {favoriteData.favorite.elo} ELO
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>🤡 Idiot</span>
                    <span>Génie 🧠</span>
                  </div>
                  <Progress value={favoriteData.algorithmScore} className="h-4" />
                  <p className="text-lg font-semibold">
                    {getAlgorithmLabel(favoriteData.algorithmScore).emoji}{" "}
                    {getAlgorithmLabel(favoriteData.algorithmScore).label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tu connais l&apos;algorithme à {favoriteData.algorithmScore}%
                  </p>
                </div>
              </div>
            )}

            {!favoriteData && (
              <div className="animate-pulse space-y-4">
                <div className="aspect-video rounded-xl bg-muted" />
                <div className="h-4 bg-muted rounded w-full" />
              </div>
            )}

            <Link
              href="/leaderboard"
              className="inline-block mt-8 text-primary hover:underline"
            >
              Voir le classement complet
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Loading thumbnails
  if (thumbnails === undefined) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto p-4 md:p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">
              Quelle miniature est la meilleure ?
            </h2>
            <p className="text-muted-foreground">
              Choisis la miniature sur laquelle tu aurais cliqué.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-w-4xl mx-auto">
            <VotingCardSkeleton />
            <VotingCardSkeleton />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto p-4 md:p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold">
            Quelle miniature est la meilleure ?
          </h2>
          <p className="text-muted-foreground">
            Choisis la miniature sur laquelle tu aurais cliqué.
          </p>
        </div>

        {!imagesLoaded || !loadedThumbnails ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-w-4xl mx-auto">
            <VotingCardSkeleton />
            <VotingCardSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-w-4xl mx-auto">
            <VotingCard
              thumbnail={loadedThumbnails.left}
              onVote={() =>
                handleVote(loadedThumbnails.left.id, loadedThumbnails.right.id)
              }
              disabled={isVoting}
            />
            <VotingCard
              thumbnail={loadedThumbnails.right}
              onVote={() =>
                handleVote(loadedThumbnails.right.id, loadedThumbnails.left.id)
              }
              disabled={isVoting}
            />
          </div>
        )}

        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>Tes votes : {totalVotes}</p>
        </div>
      </main>
    </div>
  );
}

function VotingCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-video rounded-xl bg-muted" />
      <div className="mt-3 flex gap-3">
        <div className="w-9 h-9 rounded-full bg-muted flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/3" />
        </div>
      </div>
    </div>
  );
}
