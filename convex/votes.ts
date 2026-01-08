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
    const votes = await ctx.db.query("votes").collect();
    const visitors = await ctx.db.query("visitors").collect();

    return {
      totalVotes: votes.length,
      totalVisitors: visitors.length,
    };
  },
});
