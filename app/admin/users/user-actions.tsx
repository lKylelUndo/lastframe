"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toggleUserActive, deleteUser } from "@/actions/auth";

export function UserActions({
  userId,
  isActive,
}: {
  userId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <span className="inline-flex gap-2">
      <button
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await toggleUserActive(userId);
            router.refresh();
          })
        }
        className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
      >
        {isActive ? "Disable" : "Enable"}
      </button>
      <button
        disabled={isPending}
        onClick={() => {
          if (confirm("Delete this user?")) {
            startTransition(async () => {
              try {
                await deleteUser(userId);
                router.refresh();
              } catch {
                alert("Cannot delete user with existing submissions.");
              }
            });
          }
        }}
        className="text-xs text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50"
      >
        Delete
      </button>
    </span>
  );
}
