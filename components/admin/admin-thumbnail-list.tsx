"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import Image from "next/image";
import { Id } from "@/convex/_generated/dataModel";

export function AdminThumbnailList() {
  const thumbnails = useQuery(api.thumbnails.listAllThumbnails);
  const deleteThumbnail = useMutation(api.thumbnails.deleteThumbnail);

  const handleDelete = async (id: Id<"thumbnails">) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette miniature ?")) {
      await deleteThumbnail({ id });
    }
  };

  if (!thumbnails) {
    return <div className="text-muted-foreground">Chargement des miniatures...</div>;
  }

  if (thumbnails.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8 border rounded-lg">
        Aucune miniature n'a encore été ajoutée.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Image</TableHead>
          <TableHead>Nom</TableHead>
          <TableHead className="text-right">ELO</TableHead>
          <TableHead className="text-right">Votes</TableHead>
          <TableHead className="text-right">Victoires</TableHead>
          <TableHead className="w-16">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {thumbnails.map((thumbnail) => (
          <TableRow key={thumbnail._id}>
            <TableCell>
              {thumbnail.url && (
                <Image
                  src={thumbnail.url}
                  alt={thumbnail.name}
                  width={120}
                  height={68}
                  className="rounded object-cover"
                />
              )}
            </TableCell>
            <TableCell>{thumbnail.name}</TableCell>
            <TableCell className="text-right font-mono">
              {thumbnail.elo}
            </TableCell>
            <TableCell className="text-right">{thumbnail.totalVotes}</TableCell>
            <TableCell className="text-right">{thumbnail.wins}</TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(thumbnail._id)}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
