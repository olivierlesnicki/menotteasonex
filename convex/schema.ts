import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Thumbnails table - stores uploaded images
  thumbnails: defineTable({
    storageId: v.id("_storage"),
    name: v.string(),
    elo: v.number(),
    totalVotes: v.number(),
    wins: v.number(),
    createdAt: v.number(),
  })
    .index("by_elo", ["elo"])
    .index("by_createdAt", ["createdAt"]),

  // Votes table - records all votes
  votes: defineTable({
    visitorId: v.string(),
    winnerId: v.id("thumbnails"),
    loserId: v.id("thumbnails"),
    winnerEloBefore: v.number(),
    loserEloBefore: v.number(),
    winnerEloAfter: v.number(),
    loserEloAfter: v.number(),
    createdAt: v.number(),
  })
    .index("by_visitor", ["visitorId"])
    .index("by_winner", ["winnerId"])
    .index("by_loser", ["loserId"])
    .index("by_createdAt", ["createdAt"]),

  // Anonymous visitors table
  visitors: defineTable({
    visitorToken: v.string(),
    totalVotes: v.number(),
    verified: v.boolean(),
    createdAt: v.number(),
    lastActiveAt: v.number(),
  }).index("by_token", ["visitorToken"]),
});
