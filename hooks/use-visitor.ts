"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

function generateVisitorToken(): string {
  return `visitor_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

export function useVisitor() {
  const [visitorToken, setVisitorToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getOrCreateVisitor = useMutation(api.visitors.getOrCreateVisitor);
  const verifyTurnstile = useAction(api.visitors.verifyTurnstile);
  const visitorStats = useQuery(
    api.visitors.getVisitorStats,
    visitorToken ? { visitorToken } : "skip"
  );

  useEffect(() => {
    // Check localStorage for existing token
    let token = localStorage.getItem("visitor_token");

    if (!token) {
      token = generateVisitorToken();
      localStorage.setItem("visitor_token", token);
    }

    setVisitorToken(token);

    // Register/update visitor in database
    getOrCreateVisitor({ visitorToken: token }).then(() => {
      setIsLoading(false);
    });
  }, [getOrCreateVisitor]);

  const verify = async (turnstileToken: string): Promise<boolean> => {
    if (!visitorToken) return false;

    try {
      const result = await verifyTurnstile({
        token: turnstileToken,
        visitorToken,
      });
      return result.success;
    } catch (error) {
      console.error("Verification failed:", error);
      return false;
    }
  };

  return {
    visitorToken,
    isLoading,
    totalVotes: visitorStats?.totalVotes ?? 0,
    verified: visitorStats?.verified ?? false,
    verify,
  };
}
