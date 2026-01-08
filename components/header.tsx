import Link from "next/link";

export function Header() {
  return (
    <header className="p-4">
      <div className="container mx-auto">
        <Link href="/" className="text-xl font-bold hover:opacity-80 transition-opacity">
          Menotté à son ex
        </Link>
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
