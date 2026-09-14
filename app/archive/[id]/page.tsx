import Link from "next/link"
import Image from "next/image"
import { prisma } from "@/lib/prisma"
import { formatManila } from "@/lib/dates"
import { buildImageVariants } from "@/lib/images"
import type { Metadata } from "next"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const sub = await prisma.classroomSubmission.findUnique({
    where: { id },
    select: { room: { select: { name: true } } },
  })
  return {
    title: sub ? `${sub.room.name} — LASTFRAME` : "Record — LASTFRAME",
  }
}

export default async function ArchiveDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id } = await params
  const raw = await searchParams
  const dateParam = typeof raw.date === "string" ? raw.date : undefined

  const submission = await prisma.classroomSubmission.findUnique({
    where: { id },
    select: {
      id: true,
      imageUrl: true,
      cloudinaryPublicId: true,
      submittedAt: true,
      room: { select: { name: true } },
    },
  })

  if (!submission) {
    return (
      <div className="flex min-h-svh items-center justify-center px-6">
        <p className="text-sm text-muted-foreground">Record not found.</p>
      </div>
    )
  }

  const variants = buildImageVariants(submission.imageUrl)

  const backHref = dateParam ? `/archive?date=${dateParam}` : "/archive"

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-6 sm:py-16">
      {/* Back link */}
      <nav className="mb-6">
        <Link
          href={backHref}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Back to archive
        </Link>
      </nav>

      {/* Full image */}
      <div className="relative w-full overflow-hidden rounded-lg bg-card">
        <Image
          src={variants.full}
          alt={`Classroom photo of ${submission.room.name}`}
          width={1600}
          height={900}
          sizes="(max-width:640px) 100vw, (max-width:1024px) 80vw, 1200px"
          priority
          fetchPriority="high"
          decoding="async"
          className="h-auto w-full object-contain"
          placeholder="blur"
          blurDataURL={variants.blurPlaceholder}
        />
      </div>

      {/* Meta — photograph → room → date/time hierarchy */}
      <div className="mt-4 flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground">{submission.room.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatManila(submission.submittedAt, "EEEE, MMMM d, yyyy · h:mm a")}
        </p>
      </div>
    </div>
  )
}
