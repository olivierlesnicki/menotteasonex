"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AdminThumbnailList } from "@/components/admin/admin-thumbnail-list";
import { UploadForm } from "@/components/admin/upload-form";
import Link from "next/link";

const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET;

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [secretKey, setSecretKey] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedKey = sessionStorage.getItem("admin_key");
    if (storedKey && storedKey === ADMIN_SECRET) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = () => {
    if (secretKey === ADMIN_SECRET) {
      sessionStorage.setItem("admin_key", secretKey);
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("Clé secrète invalide");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4">
          <h1 className="text-2xl font-bold text-center">Accès Admin</h1>
          <div className="space-y-2">
            <input
              type="password"
              placeholder="Entrez la clé secrète admin"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="w-full px-3 py-2 border rounded-md bg-background"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <Button onClick={handleLogin} className="w-full">
            Accéder au panneau admin
          </Button>
          <div className="text-center">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Retour aux votes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Panneau Admin</h1>
          <nav className="flex gap-4 items-center">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Voter
            </Link>
            <Link
              href="/leaderboard"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Classement
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                sessionStorage.removeItem("admin_key");
                setIsAuthenticated(false);
                setSecretKey("");
              }}
            >
              Déconnexion
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">Ajouter une miniature</h2>
            <UploadForm />
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Gérer les miniatures</h2>
            <AdminThumbnailList />
          </section>
        </div>
      </main>
    </div>
  );
}
