import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Create or get visitor (starts unverified)
export const getOrCreateVisitor = mutation({
  args: { visitorToken: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("visitors")
      .withIndex("by_token", (q) => q.eq("visitorToken", args.visitorToken))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        lastActiveAt: Date.now(),
      });
      return existing;
    }

    const visitorId = await ctx.db.insert("visitors", {
      visitorToken: args.visitorToken,
      totalVotes: 0,
      verified: false,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    });

    return await ctx.db.get(visitorId);
  },
});

// Get visitor stats including verification status
export const getVisitorStats = query({
  args: { visitorToken: v.string() },
  handler: async (ctx, args) => {
    const visitor = await ctx.db
      .query("visitors")
      .withIndex("by_token", (q) => q.eq("visitorToken", args.visitorToken))
      .first();

    if (!visitor) {
      return { totalVotes: 0, verified: false };
    }

    return { totalVotes: visitor.totalVotes, verified: visitor.verified ?? false };
  },
});

// Mark visitor as verified (called after Turnstile validation)
export const markVerified = mutation({
  args: { visitorToken: v.string() },
  handler: async (ctx, args) => {
    const visitor = await ctx.db
      .query("visitors")
      .withIndex("by_token", (q) => q.eq("visitorToken", args.visitorToken))
      .first();

    if (visitor) {
      await ctx.db.patch(visitor._id, {
        verified: true,
        lastActiveAt: Date.now(),
      });
    }
  },
});

// Verify Turnstile token with Cloudflare
export const verifyTurnstile = action({
  args: { token: v.string(), visitorToken: v.string() },
  handler: async (ctx, args) => {
    const secretKey = process.env.TURNSTILE_SECRET_KEY;

    if (!secretKey) {
      throw new Error("TURNSTILE_SECRET_KEY not configured");
    }

    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          secret: secretKey,
          response: args.token,
        }),
      }
    );

    const result = await response.json();

    if (result.success) {
      // Mark the visitor as verified
      await ctx.runMutation(api.visitors.markVerified, {
        visitorToken: args.visitorToken,
      });
      return { success: true };
    }

    return { success: false, error: result["error-codes"] };
  },
});
