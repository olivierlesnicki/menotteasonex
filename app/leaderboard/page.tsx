"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import { Header } from "@/components/header";

export default function LeaderboardPage() {
  const leaderboard = useQuery(api.thumbnails.getLeaderboard);
  const stats = useQuery(api.votes.getVoteStats);
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    name: string;
    rank: number;
    winRate: number;
  } | null>(null);

  if (!leaderboard) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto p-4 md:p-8">
          <div className="grid grid-cols-2 gap-4 mb-8 max-w-md">
            <div className="border rounded-lg p-4 text-center animate-pulse">
              <div className="h-8 w-16 bg-muted rounded mx-auto mb-2" />
              <div className="h-4 w-20 bg-muted rounded mx-auto" />
            </div>
            <div className="border rounded-lg p-4 text-center animate-pulse">
              <div className="h-8 w-16 bg-muted rounded mx-auto mb-2" />
              <div className="h-4 w-20 bg-muted rounded mx-auto" />
            </div>
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="h-6 w-10 bg-muted rounded" />
                <div className="h-16 w-28 bg-muted rounded" />
                <div className="flex-1" />
                <div className="h-5 w-12 bg-muted rounded" />
                <div className="h-5 w-12 bg-muted rounded" />
                <div className="h-5 w-12 bg-muted rounded" />
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto p-4 md:p-8">
        {stats && (
          <div className="grid grid-cols-2 gap-4 mb-8 max-w-md">
            <div className="border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.totalVotes}</div>
              <div className="text-sm text-muted-foreground">Votes totaux</div>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{stats.totalVisitors}</div>
              <div className="text-sm text-muted-foreground">Votants</div>
            </div>
          </div>
        )}

        {leaderboard.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Aucune miniature n&apos;a encore été ajoutée.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rang</TableHead>
                  <TableHead>Miniature</TableHead>
                  <TableHead className="text-right">ELO</TableHead>
                  <TableHead className="text-right">% Victoires</TableHead>
                  <TableHead className="text-right">Votes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.rank === 1 && "🥇"}
                      {item.rank === 2 && "🥈"}
                      {item.rank === 3 && "🥉"}
                      {item.rank > 3 && `#${item.rank}`}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.url && (
                          <button
                            onClick={() =>
                              setSelectedImage({
                                url: item.url!,
                                name: item.name,
                                rank: item.rank,
                                winRate: item.winRate,
                              })
                            }
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                          >
                            <Image
                              src={item.url}
                              alt={item.name}
                              width={120}
                              height={68}
                              className="rounded object-cover"
                            />
                          </button>
                        )}
                        {item.totalVotes >= 1000 && item.winRate < 50 && (
                          <span className="text-xs bg-red-500/20 text-red-500 px-2 py-1 rounded-full whitespace-nowrap">
                            Disqualifié
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {item.elo}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.winRate}%
                    </TableCell>
                    <TableCell className="text-right">
                      {item.totalVotes}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-2">
          <DialogTitle className="sr-only">
            {selectedImage?.name ?? "Miniature"}
          </DialogTitle>
          {selectedImage && (
            <div>
              <div className="relative aspect-video">
                <Image
                  src={selectedImage.url}
                  alt={selectedImage.name}
                  fill
                  className="object-contain rounded-lg"
                />
              </div>
              <div className="text-center mt-3 text-sm text-muted-foreground">
                {selectedImage.rank === 1 && "🥇 "}
                {selectedImage.rank === 2 && "🥈 "}
                {selectedImage.rank === 3 && "🥉 "}
                #{selectedImage.rank} • {selectedImage.winRate}% victoires
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
