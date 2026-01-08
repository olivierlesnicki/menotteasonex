"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useVisitor } from "@/hooks/use-visitor";
import { VotingCard } from "@/components/voting/voting-card";
import { useState, useCallback, useEffect } from "react";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
  const { visitorToken, isLoading: visitorLoading, totalVotes } = useVisitor();
  const [isVoting, setIsVoting] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadedThumbnails, setLoadedThumbnails] = useState<{
    left: { id: Id<"thumbnails">; url: string | null; name: string };
    right: { id: Id<"thumbnails">; url: string | null; name: string };
  } | null>(null);

  const thumbnails = useQuery(
    api.thumbnails.getTwoRandomThumbnails,
    visitorToken ? { visitorId: visitorToken } : "skip"
  );
  const castVote = useMutation(api.votes.castVote);

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
        // Still show images even if preload fails
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

  if (visitorLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (thumbnails === null) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p className="text-lg mb-2">
              Tu as voté sur toutes les combinaisons !
            </p>
            <p>
              Merci pour ta participation. Reviens quand de nouvelles miniatures
              seront ajoutées.
            </p>
            <a
              href="/leaderboard"
              className="inline-block mt-4 text-primary hover:underline"
            >
              Voir le classement
            </a>
          </div>
        </main>
      </div>
    );
  }

  if (thumbnails === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Chargement...</div>
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

function Header() {
  return (
    <header className="p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">Menotté à son ex</h1>
        <nav className="flex gap-4 items-center">
          <Button asChild variant="outline">
            <Link href="/leaderboard">Classement</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

function VotingCardSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Thumbnail skeleton */}
      <div className="aspect-video rounded-xl bg-muted" />
      {/* Metadata skeleton */}
      <div className="mt-3 flex gap-3">
        {/* Avatar skeleton */}
        <div className="w-9 h-9 rounded-full bg-muted flex-shrink-0" />
        {/* Text skeleton */}
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/3" />
        </div>
      </div>
    </div>
  );
}
