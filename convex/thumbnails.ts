import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Generate upload URL for admin
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Create thumbnail record after upload
export const createThumbnail = mutation({
  args: {
    storageId: v.id("_storage"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const thumbnailId = await ctx.db.insert("thumbnails", {
      storageId: args.storageId,
      name: args.name,
      elo: 1000,
      totalVotes: 0,
      wins: 0,
      createdAt: Date.now(),
    });
    return thumbnailId;
  },
});

// Delete thumbnail (admin only)
export const deleteThumbnail = mutation({
  args: { id: v.id("thumbnails") },
  handler: async (ctx, args) => {
    const thumbnail = await ctx.db.get(args.id);
    if (thumbnail) {
      await ctx.storage.delete(thumbnail.storageId);
      await ctx.db.delete(args.id);
    }
  },
});

// Get all thumbnails for admin panel
export const listAllThumbnails = query({
  args: {},
  handler: async (ctx) => {
    const thumbnails = await ctx.db.query("thumbnails").order("desc").collect();

    return Promise.all(
      thumbnails.map(async (thumbnail) => ({
        ...thumbnail,
        url: await ctx.storage.getUrl(thumbnail.storageId),
      }))
    );
  },
});

// Get leaderboard (sorted by win rate)
export const getLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    const thumbnails = await ctx.db.query("thumbnails").collect();

    // Sort by win rate descending, then by total votes as tiebreaker
    const sorted = thumbnails.sort((a, b) => {
      const winRateA = a.totalVotes > 0 ? a.wins / a.totalVotes : 0;
      const winRateB = b.totalVotes > 0 ? b.wins / b.totalVotes : 0;

      if (winRateB !== winRateA) {
        return winRateB - winRateA;
      }
      // Tiebreaker: more votes = higher rank
      return b.totalVotes - a.totalVotes;
    });

    return Promise.all(
      sorted.map(async (thumbnail, index) => ({
        rank: index + 1,
        id: thumbnail._id,
        name: thumbnail.name,
        elo: thumbnail.elo,
        totalVotes: thumbnail.totalVotes,
        wins: thumbnail.wins,
        winRate:
          thumbnail.totalVotes > 0
            ? Math.round((thumbnail.wins / thumbnail.totalVotes) * 100)
            : 0,
        url: await ctx.storage.getUrl(thumbnail.storageId),
      }))
    );
  },
});

// Get two random thumbnails for voting (excluding pairs already voted by this visitor)
// Using mutation instead of query to avoid reactivity issues when others vote
export const getNextPair = mutation({
  args: { visitorId: v.string() },
  handler: async (ctx, args) => {
    const thumbnails = await ctx.db.query("thumbnails").collect();

    if (thumbnails.length < 2) {
      return { status: "not_enough" as const };
    }

    // Get all votes by this visitor to exclude already-seen pairs
    const votedPairs = new Set<string>();
    const visitorVotes = await ctx.db
      .query("votes")
      .withIndex("by_visitor", (q) => q.eq("visitorId", args.visitorId))
      .collect();

    // Create a set of pair keys (sorted IDs to handle both directions)
    for (const vote of visitorVotes) {
      const pairKey = [vote.winnerId, vote.loserId].sort().join("-");
      votedPairs.add(pairKey);
    }

    // Generate all possible pairs
    const allPairs: Array<{ first: (typeof thumbnails)[0]; second: (typeof thumbnails)[0] }> = [];
    for (let i = 0; i < thumbnails.length; i++) {
      for (let j = i + 1; j < thumbnails.length; j++) {
        const pairKey = [thumbnails[i]._id, thumbnails[j]._id].sort().join("-");
        if (!votedPairs.has(pairKey)) {
          allPairs.push({ first: thumbnails[i], second: thumbnails[j] });
        }
      }
    }

    // If all pairs have been voted on, return done status
    if (allPairs.length === 0) {
      return { status: "done" as const };
    }

    // Pick a random pair from available pairs
    const randomIndex = Math.floor(Math.random() * allPairs.length);
    const { first, second } = allPairs[randomIndex];

    // Randomize which one is left vs right
    const swap = Math.random() > 0.5;
    const left = swap ? second : first;
    const right = swap ? first : second;

    return {
      status: "ok" as const,
      left: {
        id: left._id,
        url: await ctx.storage.getUrl(left.storageId),
        name: left.name,
      },
      right: {
        id: right._id,
        url: await ctx.storage.getUrl(right.storageId),
        name: right.name,
      },
    };
  },
});
