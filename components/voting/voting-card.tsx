"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { Id } from "@/convex/_generated/dataModel";

interface ThumbnailData {
  id: Id<"thumbnails">;
  url: string | null;
  name: string;
}

interface VotingCardProps {
  thumbnail: ThumbnailData;
  onVote: () => void;
  disabled?: boolean;
}

export function VotingCard({ thumbnail, onVote, disabled }: VotingCardProps) {
  return (
    <button
      onClick={onVote}
      disabled={disabled}
      className={cn(
        "text-left",
        "transition-all duration-200 ease-out",
        "hover:scale-[1.02]",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:rounded-xl",
        "disabled:opacity-50 disabled:pointer-events-none",
        "group cursor-pointer"
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video rounded-xl overflow-hidden border-4 border-transparent group-hover:border-primary group-hover:shadow-xl transition-all">
        {thumbnail.url ? (
          <Image
            src={thumbnail.url}
            alt={thumbnail.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground">Pas d'image</span>
          </div>
        )}

        {/* Hover overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-primary/20 opacity-0 transition-opacity",
            "group-hover:opacity-100"
          )}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium">
              Voter pour celle-ci
            </span>
          </div>
        </div>
      </div>

      {/* YouTube-style metadata */}
      <div className="mt-3 flex gap-3">
        {/* Channel avatar */}
        <div className="flex-shrink-0">
          <img
            src="https://yt3.googleusercontent.com/RwBe-bCmUF3GbDcBWhIMmynMOJswB-1XPawxXkQZ5oxmcLimbzLN1vRKJC3I0ajGGAsfgCJaaA=s160-c-k-c0x00ffffff-no-rj"
            alt="Le Motif"
            className="w-9 h-9 rounded-full"
          />
        </div>
        {/* Title and channel */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm leading-tight line-clamp-2">
            Menotté à son ex (pendant 7 jours)
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            @lemotif2
          </p>
        </div>
      </div>
    </button>
  );
}
