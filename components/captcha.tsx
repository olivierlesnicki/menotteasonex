"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { useState } from "react";

interface CaptchaProps {
  onVerify: (token: string) => Promise<boolean>;
}

export function Captcha({ onVerify }: CaptchaProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = async (token: string) => {
    setIsVerifying(true);
    setError(null);

    const success = await onVerify(token);

    if (!success) {
      setError("Vérification échouée. Veuillez réessayer.");
    }

    setIsVerifying(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Vérification</h2>
        <p className="text-muted-foreground">
          Confirme que tu es humain pour pouvoir voter.
        </p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <Turnstile
          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
          onSuccess={handleSuccess}
          onError={() => setError("Erreur de chargement. Veuillez rafraîchir.")}
          options={{
            theme: "auto",
            language: "fr",
          }}
        />

        {isVerifying && (
          <p className="text-muted-foreground">Vérification en cours...</p>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    </div>
  );
}
