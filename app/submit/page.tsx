import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { SubmitForm } from "./submit-form";

export default async function SubmitPage() {
  await requireAdmin();

  const rooms = await prisma.room.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="min-h-svh px-5 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-lg space-y-8">
        {/* Header — consistent title-left, back-right */}
        <header>
          <h1>Submit Last Frame</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            JPG, PNG, or WebP up to 10 MB.
          </p>
        </header>
        <SubmitForm rooms={rooms} />
      </div>
    </div>
  );
}
