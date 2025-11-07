"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { CountingNumber } from "@/components/animate-ui/primitives/texts/counting-number";

interface YouTubeData {
  subscriberCount: string;
  viewCount: string;
  videoCount: string;
  title: string;
  thumbnail: string;
}

export default function Home() {
  const [youtubeData, setYoutubeData] = useState<YouTubeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const baseSubscribers = 68180;

  useEffect(() => {
    const fetchYouTubeData = async () => {
      try {
        const response = await fetch("/api/youtube");
        if (!response.ok) {
          throw new Error("Failed to fetch YouTube data");
        }
        const data = await response.json();
        setYoutubeData(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchYouTubeData();

    // Refresh every 30 seconds
    const interval = setInterval(fetchYouTubeData, 30000);

    return () => clearInterval(interval);
  }, []);

  const currentSubscribers = youtubeData
    ? parseInt(youtubeData.subscriberCount)
    : baseSubscribers;

  return (
    <div className="min-h-svh flex flex-col justify-center items-center relative mx-auto max-w-screen-sm gap-6 md:gap-12 p-6 md:py-24">
      <div className="text-2xl md:text-4xl font-black">Menotté à son ex</div>
      <div className="flex w-full border p-6 rounded-xl gap-4 md:flex-row flex-col md:items-center">
        <div className="flex-1 flex gap-4 items-center">
          <div>
            <img
              src="https://yt3.googleusercontent.com/RwBe-bCmUF3GbDcBWhIMmynMOJswB-1XPawxXkQZ5oxmcLimbzLN1vRKJC3I0ajGGAsfgCJaaA=s160-c-k-c0x00ffffff-no-rj"
              alt="Le Motif (Nouvelle Chaîne)"
              className="rounded-full size-12"
            />
          </div>
          <div className="flex-1">
            <div className="text-sm font-black">Le Motif (Nouvelle Chaîne)</div>
            <div className="text-sm text-muted-foreground">@lemotif2</div>
          </div>
        </div>
        <Button size="lg" asChild>
          <a href="https://taap.it/kD81wE">Abonne-toi</a>
        </Button>
      </div>
      <div className="w-full border p-6 md:p-12 rounded-xl flex flex-col items-center justify-center gap-2 md:gap-4">
        <div className="uppercase text-sm text-muted-foreground">
          Abonnés en direct
        </div>
        {loading ? (
          <div className="text-4xl md:text-8xl font-black text-muted-foreground">
            ...
          </div>
        ) : error ? (
          <div className="text-2xl md:text-4xl font-black text-red-500">
            Erreur
          </div>
        ) : (
          <div className="text-4xl md:text-8xl font-black">
            <CountingNumber number={currentSubscribers} />
          </div>
        )}
      </div>
      <div className="w-full p-6 md:p-12 bg-muted rounded-xl flex flex-col items-center justify-center gap-2 md:gap-4">
        <div className="text-center">
          <div className="uppercase text-sm text-muted-foreground">
            Cagnotte
          </div>
          <div className="text-sm text-muted-foreground">
            Chaque abonné au dessus de 68180
          </div>
        </div>
        {loading ? (
          <div className="text-4xl md:text-8xl font-black text-muted-foreground">
            ...
          </div>
        ) : error ? (
          <div className="text-2xl md:text-4xl font-black text-red-500">
            Erreur
          </div>
        ) : (
          <div className="text-4xl md:text-8xl font-black">
            <CountingNumber number={currentSubscribers - 68180} />€
          </div>
        )}
      </div>
    </div>
  );
}
