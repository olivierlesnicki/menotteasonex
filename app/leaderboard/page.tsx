"use client";

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
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LeaderboardPage() {
  const leaderboard = useQuery(api.thumbnails.getLeaderboard);
  const stats = useQuery(api.votes.getVoteStats);

  if (!leaderboard) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Chargement du classement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">
            Classement
          </Link>
          <nav className="flex gap-4">
            <Button asChild variant="outline">
              <Link
                href="/"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Voter
              </Link>
            </Button>
          </nav>
        </div>
      </header>

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
                      {item.url && (
                        <Image
                          src={item.url}
                          alt={item.name}
                          width={120}
                          height={68}
                          className="rounded object-cover"
                        />
                      )}
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
    </div>
  );
}
