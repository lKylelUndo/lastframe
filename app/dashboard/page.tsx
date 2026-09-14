import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { formatManila } from "@/lib/dates";

export default async function DashboardPage() {
  const { userId } = await requireAdmin();

  const user = await prisma.user.findUnique({ where: { id: userId } });

  const [recentSubmissions, userCount, roomCount, submissionCount] =
    await Promise.all([
      prisma.classroomSubmission.findMany({
        take: 5,
        orderBy: { submittedAt: "desc" },
        select: {
          id: true,
          imageUrl: true,
          submittedAt: true,
          room: { select: { name: true } },
        },
      }),
      prisma.user.count(),
      prisma.room.count(),
      prisma.classroomSubmission.count(),
    ]);

  return (
    <div className="min-h-svh px-5 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-2xl space-y-10">
        {/* Header — title left, actions right, consistent position */}
        <header>
          <h1>Dashboard</h1>
          {user && (
            <p className="mt-1 text-sm text-muted-foreground">
              {user.name}
            </p>
          )}
        </header>

        {/* Primary action */}
        <div>
          <Link
            href="/submit"
            className="flex h-12 items-center rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
          >
            Submit Last Frame
          </Link>
        </div>

        {/* Admin overview card */}
        <section className="rounded-lg border border-border p-5">
          <h2 className="text-sm font-medium text-foreground">Admin</h2>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div>
              <p className="text-2xl font-semibold tracking-tight">
                {userCount}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">Users</p>
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight">
                {roomCount}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">Rooms</p>
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight">
                {submissionCount}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Submissions
              </p>
            </div>
          </div>
          <nav className="mt-5 space-y-3">
            <Link
              href="/admin/users"
              className="flex h-12 items-center rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
            >
              Manage Users
            </Link>
            <Link
              href="/admin/rooms"
              className="flex h-12 items-center rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
            >
              Manage Rooms
            </Link>
          </nav>
        </section>

        {/* Recent submissions */}
        <section className="space-y-4">
          <h2>Recent Submissions</h2>
          {recentSubmissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No submissions yet.</p>
          ) : (
            <div className="space-y-3">
              {recentSubmissions.map((sub: { id: string; imageUrl: string; room: { name: string }; submittedAt: Date | string }) => (
                <div
                  key={sub.id}
                  className="flex items-center gap-4 rounded-lg border border-border p-3"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sub.imageUrl}
                    alt={`Submission in ${sub.room.name}`}
                    className="h-12 w-12 rounded object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {sub.room.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatManila(sub.submittedAt, "MMM d, yyyy · HH:mm")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
