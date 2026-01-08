"use client";

import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, Check } from "lucide-react";

type UploadStage = "idle" | "converting" | "uploading" | "saving" | "done";

export function UploadForm() {
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [stage, setStage] = useState<UploadStage>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.thumbnails.generateUploadUrl);
  const createThumbnail = useMutation(api.thumbnails.createThumbnail);

  const isUploading = stage !== "idle" && stage !== "done";

  // Resize image to 1080p (1920x1080) maintaining aspect ratio
  const resizeImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        // Target dimensions (1080p)
        const targetWidth = 1920;
        const targetHeight = 1080;

        // Calculate dimensions to cover the target area (crop to fit)
        const sourceAspect = img.width / img.height;
        const targetAspect = targetWidth / targetHeight;

        let sourceX = 0;
        let sourceY = 0;
        let sourceWidth = img.width;
        let sourceHeight = img.height;

        if (sourceAspect > targetAspect) {
          // Image is wider - crop sides
          sourceWidth = img.height * targetAspect;
          sourceX = (img.width - sourceWidth) / 2;
        } else {
          // Image is taller - crop top/bottom
          sourceHeight = img.width / targetAspect;
          sourceY = (img.height - sourceHeight) / 2;
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Draw resized image
        ctx.drawImage(
          img,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          0,
          0,
          targetWidth,
          targetHeight
        );

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Failed to convert canvas to blob"));
            }
          },
          "image/jpeg",
          0.9
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  };

  // Upload with progress tracking
  const uploadWithProgress = (
    url: string,
    blob: Blob
  ): Promise<{ storageId: string }> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percent);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch {
            reject(new Error("Invalid response"));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () => reject(new Error("Upload failed")));
      xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));

      xhr.open("POST", url);
      xhr.setRequestHeader("Content-Type", "image/jpeg");
      xhr.send(blob);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setError("");
      setStage("idle");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file");
      return;
    }

    setError("");
    setUploadProgress(0);

    try {
      // Stage 1: Convert to 1080p
      setStage("converting");
      const resizedBlob = await resizeImage(file);

      // Stage 2: Get upload URL and upload
      setStage("uploading");
      const uploadUrl = await generateUploadUrl();
      const { storageId } = await uploadWithProgress(uploadUrl, resizedBlob);

      // Stage 3: Save to database
      setStage("saving");
      await createThumbnail({
        storageId: storageId as Id<"_storage">,
        name: name || file.name.replace(/\.[^/.]+$/, ""),
      });

      // Done!
      setStage("done");

      // Reset form after a brief moment
      setTimeout(() => {
        setName("");
        setFile(null);
        setPreview(null);
        setStage("idle");
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setStage("idle");
    }
  };

  const getStageText = () => {
    switch (stage) {
      case "converting":
        return "Conversion en 1080p...";
      case "uploading":
        return `Téléversement... ${uploadProgress}%`;
      case "saving":
        return "Enregistrement...";
      case "done":
        return "Terminé !";
      default:
        return "Ajouter la miniature";
    }
  };

  const getProgressWidth = () => {
    switch (stage) {
      case "converting":
        return "15%";
      case "uploading":
        return `${15 + uploadProgress * 0.75}%`;
      case "saving":
        return "95%";
      case "done":
        return "100%";
      default:
        return "0%";
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Nom de la miniature (optionnel)
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Entrez un nom pour cette miniature"
          className="w-full px-3 py-2 border rounded-md bg-background"
          disabled={isUploading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Fichier image</label>
        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isUploading
              ? "cursor-not-allowed opacity-60"
              : "cursor-pointer hover:border-primary"
          }`}
        >
          {preview ? (
            <img
              src={preview}
              alt="Aperçu"
              className="max-h-48 mx-auto rounded"
            />
          ) : (
            <div className="text-muted-foreground">
              <Upload className="w-8 h-8 mx-auto mb-2" />
              <p>Cliquez pour sélectionner une image</p>
              <p className="text-xs mt-1">Sera convertie en 1080p</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />
        </div>
      </div>

      {/* Progress Bar */}
      {(isUploading || stage === "done") && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{getStageText()}</span>
            {stage === "done" && (
              <Check className="w-4 h-4 text-green-500" />
            )}
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ease-out ${
                stage === "done" ? "bg-green-500" : "bg-primary"
              }`}
              style={{ width: getProgressWidth() }}
            />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" disabled={isUploading || !file || stage === "done"}>
        {isUploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {getStageText()}
          </>
        ) : stage === "done" ? (
          <>
            <Check className="w-4 h-4 mr-2" />
            Ajoutée !
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Ajouter la miniature
          </>
        )}
      </Button>
    </form>
  );
}
