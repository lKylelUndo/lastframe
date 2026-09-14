import Link from "next/link"
import Image from "next/image"
import { prisma } from "@/lib/prisma"
import { cacheGet, cacheSet } from "@/lib/redis"
import { manilaDayRange, todayManilaYMD, formatManila } from "@/lib/dates"
import { archiveQuerySchema } from "@/lib/validations"
import { buildImageVariants } from "@/lib/images"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Archive — LASTFRAME",
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Ensure YYYY-MM-DD (pad leading zeros). */
function padYMD(ymd: string): string {
  const [y, m, d] = ymd.split("-")
  return `${y}-${(m ?? "1").padStart(2, "0")}-${(d ?? "1").padStart(2, "0")}`
}

function dayLink(date: string, offset: number, roomId?: string): string {
  const d = new Date(`${date}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + offset)
  const ymd = [
    d.getUTCFullYear(),
    String(d.getUTCMonth() + 1).padStart(2, "0"),
    String(d.getUTCDate()).padStart(2, "0"),
  ].join("-")
  const params = new URLSearchParams({ date: ymd })
  if (roomId) params.set("roomId", roomId)
  return `/archive?${params.toString()}`
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface RoomRow {
  id: string
  name: string
}

interface SubmissionRow {
  id: string
  imageUrl: string
  cloudinaryPublicId: string
  submittedAt: Date
  room: { name: string }
}

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const raw = await searchParams

  // Normalise date param: accept single string
  const dateParam = typeof raw.date === "string" ? raw.date : undefined
  const roomIdParam = typeof raw.roomId === "string" ? raw.roomId : undefined
  const pageParam = typeof raw.page === "string" ? raw.page : undefined

  const parsed = archiveQuerySchema.safeParse({
    date: dateParam,
    roomId: roomIdParam,
    page: pageParam ?? 1,
  })

  const query = parsed.success
    ? parsed.data
    : { date: padYMD(todayManilaYMD()), roomId: undefined, page: 1, pageSize: 20 }

  const displayDate = query.date ?? padYMD(todayManilaYMD())
  const roomId = query.roomId
  const page = query.page
  const pageSize = query.pageSize

  /* ---- Rooms (cached 5 min) ---- */
  const roomsCacheKey = "lastframe:rooms"
  let rooms = await cacheGet<RoomRow[]>(roomsCacheKey)
  if (!rooms) {
    rooms = await prisma.room.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    })
    await cacheSet(roomsCacheKey, rooms, 300)
  }

  /* ---- Day range ---- */
  const { start, end } = manilaDayRange(displayDate)

  /* ---- Query (cached 60 s, fail-open) ---- */
  const cacheKey = `lastframe:archive:${displayDate}:${roomId ?? ""}:${page}`
  let submissions = await cacheGet<SubmissionRow[]>(cacheKey)
  let totalCount = 0

  if (!submissions) {
    const where: Record<string, unknown> = {
      submittedAt: { gte: start, lt: end },
    }
    if (roomId) {
      where.roomId = roomId
    }

    const [rows, count] = await Promise.all([
      prisma.classroomSubmission.findMany({
        where,
        select: {
          id: true,
          imageUrl: true,
          cloudinaryPublicId: true,
          submittedAt: true,
          room: { select: { name: true } },
        },
        orderBy: { submittedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.classroomSubmission.count({ where }),
    ])

    submissions = rows as SubmissionRow[]
    totalCount = count
    await cacheSet(cacheKey, submissions, 60)
  } else {
    // Re-count for pagination (cheap index query)
    const where: Record<string, unknown> = {
      submittedAt: { gte: start, lt: end },
    }
    if (roomId) where.roomId = roomId
    totalCount = await prisma.classroomSubmission.count({ where })
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-6 sm:py-16">
      {/* ---- Header ---- */}
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1>Archive</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {displayDate} — {totalCount} record{totalCount !== 1 && "s"}
          </p>
        </div>

        {/* Day navigation */}
        <nav className="flex items-center gap-4 text-sm">
          <Link
            href={dayLink(displayDate, -1, roomId)}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Prev
          </Link>
          <Link
            href={dayLink(displayDate, 0, roomId)}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Today
          </Link>
          <Link
            href={dayLink(displayDate, 1, roomId)}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Next
          </Link>
        </nav>
      </header>

      {/* ---- Filters ---- */}
      <form className="mb-8 grid grid-cols-1 items-end gap-3 sm:grid-cols-[auto_auto_1fr_auto]">
        {/* Native date input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Date
          </label>
          <input
            type="date"
            name="date"
            defaultValue={displayDate}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/50"
          />
        </div>

        {/* Room select */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Room
          </label>
          <select
            name="roomId"
            defaultValue={roomId ?? ""}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/50"
          >
            <option value="">All rooms</option>
            {(rooms ?? []).map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="hidden sm:block" />

        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          Filter
        </button>
      </form>

      {/* ---- Grid ---- */}
      {submissions.length === 0 ? (
        <p className="py-20 text-center text-sm text-muted-foreground">
          No records for this date.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {submissions.map((sub, idx) => {
            const variants = buildImageVariants(sub.imageUrl)
            const isAboveFold = idx === 0
            return (
              <Link
                key={sub.id}
                href={`/archive/${sub.id}?date=${displayDate}`}
                className="group block overflow-hidden rounded-lg bg-card"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                  <Image
                    src={variants.card}
                    alt={`Classroom photo of ${sub.room.name}`}
                    fill
                    sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
                    className="object-cover transition-opacity duration-150 group-hover:opacity-90"
                    loading={isAboveFold ? "eager" : "lazy"}
                    priority={isAboveFold}
                    fetchPriority={isAboveFold ? "high" : "low"}
                    decoding="async"
                    placeholder="blur"
                    blurDataURL={variants.blurPlaceholder}
                  />
                </div>
                <div className="px-3 py-2.5">
                  <p className="text-sm font-medium text-foreground">{sub.room.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatManila(sub.submittedAt, "MMM d, yyyy · h:mm a")}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* ---- Pagination ---- */}
      {totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-4 text-sm">
          {page > 1 && (
            <Link
              href={`/archive?date=${displayDate}${roomId ? `&roomId=${roomId}` : ""}&page=${page - 1}`}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Previous
            </Link>
          )}
          <span className="text-muted-foreground">
            {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/archive?date=${displayDate}${roomId ? `&roomId=${roomId}` : ""}&page=${page + 1}`}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Next
            </Link>
          )}
        </nav>
      )}
    </div>
  )
}
