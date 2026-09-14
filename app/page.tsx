import Link from "next/link"
import Image from "next/image"
import { prisma } from "@/lib/prisma"
import { cacheGet, cacheSet } from "@/lib/redis"
import { buildImageVariants } from "@/lib/images"
import { formatManila } from "@/lib/dates"
import { getSession } from "@/lib/auth"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SnapshotItem {
  id: string
  imageUrl: string
  submittedAt: string
  roomName: string
}

interface LiveSnapshot {
  latest: SnapshotItem[]
  totalRecords: number
  totalRooms: number
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function HomePage() {
  const session = await getSession()

  /* ---- Live data (Redis 60 s, fail-open) ---- */
  let snapshot: LiveSnapshot | null = null
  const cacheKey = "lastframe:home:snapshot"

  try {
    snapshot = await cacheGet<LiveSnapshot>(cacheKey)

    if (!snapshot) {
      const [rows, totalRecords, totalRooms] = await Promise.all([
        prisma.classroomSubmission.findMany({
          select: {
            id: true,
            imageUrl: true,
            submittedAt: true,
            room: { select: { name: true } },
          },
          orderBy: { submittedAt: "desc" },
          take: 6,
        }),
        prisma.classroomSubmission.count(),
        prisma.room.count(),
      ])

      snapshot = {
        latest: rows.map((r: { id: string; imageUrl: string; submittedAt: Date; room: { name: string } }) => ({
          id: r.id,
          imageUrl: r.imageUrl,
          submittedAt: r.submittedAt.toISOString(),
          roomName: r.room.name,
        })),
        totalRecords,
        totalRooms,
      }

      await cacheSet(cacheKey, snapshot, 60)
    }
  } catch {
    // fail-open: render static sections only, never crash
    snapshot = null
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-6 sm:py-16">
      {/* ---------------------------------------------------------- */}
      {/*  Hero                                                       */}
      {/* ---------------------------------------------------------- */}
      <section className="flex flex-col items-center gap-5 pb-16 text-center">
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          LASTFRAME
        </p>
        <h1 className="max-w-lg text-2xl font-light leading-snug text-foreground sm:text-3xl">
          The last frame before leaving.
        </h1>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          A quiet archive of the final photograph taken in each classroom
          before it empties.
        </p>
        <div className="flex items-center gap-3 pt-2">
          <Link
            href="/archive"
            className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85"
          >
            View Archive
          </Link>
          {!session && (
            <Link
              href="/login"
              className="inline-flex h-10 items-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Sign In
            </Link>
          )}
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/*  Overview strip                                              */}
      {/* ---------------------------------------------------------- */}
      <section className="grid grid-cols-1 gap-8 border-y border-border py-10 sm:grid-cols-3 sm:gap-0">
        <div className="text-center sm:border-r sm:border-border sm:px-6">
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            When
          </p>
          <p className="mt-2 text-sm text-foreground">
            Today, in Manila time
          </p>
        </div>
        <div className="text-center sm:border-r sm:border-border sm:px-6">
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Where
          </p>
          <p className="mt-2 text-sm text-foreground">
            Every classroom with a story
          </p>
        </div>
        <div className="text-center sm:px-6">
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            What
          </p>
          <p className="mt-2 text-sm text-foreground">
            A photo of the room, as it was left.
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/*  Live snapshot                                               */}
      {/* ---------------------------------------------------------- */}
      {snapshot && snapshot.latest.length > 0 && (
        <section className="py-12">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2>Latest Records</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {snapshot.totalRecords.toLocaleString()} record
                {snapshot.totalRecords !== 1 && "s"} across{" "}
                {snapshot.totalRooms.toLocaleString()} room
                {snapshot.totalRooms !== 1 && "s"}
              </p>
            </div>
            <Link
              href="/archive"
              className="text-xs text-amber underline-offset-4 hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {snapshot.latest.map((sub, idx) => {
              const variants = buildImageVariants(sub.imageUrl)
              return (
                <Link
                  key={sub.id}
                  href={`/archive/${sub.id}`}
                  className="group block overflow-hidden rounded-lg bg-card"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                    <Image
                      src={variants.thumb}
                      alt={`Classroom photo of ${sub.roomName}`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-opacity duration-150 group-hover:opacity-90"
                      loading={idx < 2 ? "eager" : "lazy"}
                      priority={idx < 2}
                      placeholder="blur"
                      blurDataURL={variants.blurPlaceholder}
                    />
                  </div>
                  <div className="px-3 py-2.5">
                    <p className="truncate text-sm font-medium text-foreground">
                      {sub.roomName}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatManila(sub.submittedAt, "MMM d, yyyy")}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------- */}
      {/*  How it works                                                */}
      {/* ---------------------------------------------------------- */}
      <section className="border-t border-border pt-12">
        <h2 className="mb-8 text-center">How It Works</h2>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-0">
          <div className="text-center sm:border-r sm:border-border sm:px-6">
            <p className="text-base font-medium text-foreground">Document</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Photograph a classroom before it empties.
            </p>
          </div>
          <div className="text-center sm:border-r sm:border-border sm:px-6">
            <p className="text-base font-medium text-foreground">Archive</p>
            <p className="mt-2 text-sm text-muted-foreground">
              It joins the growing collection, organized by date and room.
            </p>
          </div>
          <div className="text-center sm:px-6">
            <p className="text-base font-medium text-foreground">Navigate</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Browse the archive by day and location.
            </p>
          </div>
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/archive"
            className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85"
          >
            Explore the Archive
          </Link>
        </div>
      </section>
    </div>
  )
}
