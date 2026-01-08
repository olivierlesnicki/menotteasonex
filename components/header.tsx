"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const isLeaderboard = pathname === "/leaderboard";

  return (
    <header className="p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold hover:opacity-80 transition-opacity">
          Menotté à son ex
        </Link>
        <nav className="flex gap-4 items-center">
          <Button
            asChild
            variant={isLeaderboard ? "default" : "outline"}
            className={cn(isLeaderboard && "pointer-events-none")}
          >
            <Link href="/leaderboard">Classement</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

export function HeaderSkeleton() {
  return (
    <header className="p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="h-7 w-40 bg-muted rounded animate-pulse" />
        <div className="h-9 w-24 bg-muted rounded animate-pulse" />
      </div>
    </header>
  );
}
