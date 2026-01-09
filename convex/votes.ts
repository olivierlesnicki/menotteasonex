import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { calculateElo } from "./lib/elo";

// Cast a vote
export const castVote = mutation({
  args: {
    visitorId: v.string(),
    winnerId: v.id("thumbnails"),
    loserId: v.id("thumbnails"),
  },
  handler: async (ctx, args) => {
    const winner = await ctx.db.get(args.winnerId);
    const loser = await ctx.db.get(args.loserId);

    if (!winner || !loser) {
      throw new Error("Invalid thumbnail IDs");
    }

    // Calculate new ELO scores
    const { newWinnerElo, newLoserElo } = calculateElo(winner.elo, loser.elo);

    // Update winner
    await ctx.db.patch(args.winnerId, {
      elo: newWinnerElo,
      totalVotes: winner.totalVotes + 1,
      wins: winner.wins + 1,
    });

    // Update loser
    await ctx.db.patch(args.loserId, {
      elo: newLoserElo,
      totalVotes: loser.totalVotes + 1,
    });

    // Record the vote
    await ctx.db.insert("votes", {
      visitorId: args.visitorId,
      winnerId: args.winnerId,
      loserId: args.loserId,
      winnerEloBefore: winner.elo,
      loserEloBefore: loser.elo,
      winnerEloAfter: newWinnerElo,
      loserEloAfter: newLoserElo,
      createdAt: Date.now(),
    });

    // Update visitor stats
    const visitor = await ctx.db
      .query("visitors")
      .withIndex("by_token", (q) => q.eq("visitorToken", args.visitorId))
      .first();

    if (visitor) {
      await ctx.db.patch(visitor._id, {
        totalVotes: visitor.totalVotes + 1,
        lastActiveAt: Date.now(),
      });
    }

    return { newWinnerElo, newLoserElo };
  },
});

// Get vote statistics
export const getVoteStats = query({
  args: {},
  handler: async (ctx) => {
    // Get visitors and sum their totalVotes instead of counting all vote documents
    const visitors = await ctx.db.query("visitors").collect();
    const totalVotes = visitors.reduce((sum, v) => sum + v.totalVotes, 0);

    return {
      totalVotes,
      totalVisitors: visitors.length,
    };
  },
});

// Get visitor's favorite thumbnail and algorithm score
export const getVisitorFavorite = query({
  args: { visitorId: v.string() },
  handler: async (ctx, args) => {
    // Get all votes by this visitor
    const visitorVotes = await ctx.db
      .query("votes")
      .withIndex("by_visitor", (q) => q.eq("visitorId", args.visitorId))
      .collect();

    if (visitorVotes.length === 0) {
      return null;
    }

    // Count wins per thumbnail
    const winCounts: Record<string, number> = {};
    for (const vote of visitorVotes) {
      const winnerId = vote.winnerId;
      winCounts[winnerId] = (winCounts[winnerId] || 0) + 1;
    }

    // Find the favorite (most voted for)
    let favoriteId = "";
    let maxWins = 0;
    for (const [id, wins] of Object.entries(winCounts)) {
      if (wins > maxWins) {
        maxWins = wins;
        favoriteId = id;
      }
    }

    // Get all thumbnails sorted by win rate to find rankings
    const allThumbnails = await ctx.db.query("thumbnails").collect();

    const totalThumbnails = allThumbnails.length;
    if (totalThumbnails === 0) return null;

    // Sort by win rate descending
    const sortedThumbnails = allThumbnails.sort((a, b) => {
      const winRateA = a.totalVotes > 0 ? a.wins / a.totalVotes : 0;
      const winRateB = b.totalVotes > 0 ? b.wins / b.totalVotes : 0;
      if (winRateB !== winRateA) {
        return winRateB - winRateA;
      }
      return b.totalVotes - a.totalVotes;
    });

    // Find the favorite thumbnail in the sorted list
    const favorite = sortedThumbnails.find((t) => t._id === favoriteId);
    if (!favorite) return null;

    // Find the rank of the favorite thumbnail
    const favoriteRank = sortedThumbnails.findIndex((t) => t._id === favoriteId) + 1;

    // Calculate score: 100 if #1, 0 if last
    // Score = 100 * (totalThumbnails - favoriteRank) / (totalThumbnails - 1)
    const algorithmScore =
      totalThumbnails === 1
        ? 100
        : Math.round((100 * (totalThumbnails - favoriteRank)) / (totalThumbnails - 1));

    // Get storage URL for favorite
    const url = await ctx.storage.getUrl(favorite.storageId);

    const winRate = favorite.totalVotes > 0
      ? Math.round((favorite.wins / favorite.totalVotes) * 100)
      : 0;

    return {
      favorite: {
        id: favorite._id,
        name: favorite.name,
        url,
        winRate,
        rank: favoriteRank,
      },
      algorithmScore,
      totalThumbnails,
      timesVotedForFavorite: maxWins,
    };
  },
});
