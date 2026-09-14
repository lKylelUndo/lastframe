import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { RoomForm } from "./room-form";
import { RoomActions } from "./room-actions";

export default async function AdminRoomsPage() {
  await requireAdmin();

  const rooms = await prisma.room.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { submissions: true } } },
  });

  return (
    <div className="min-h-svh px-5 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-2xl space-y-10">
        {/* Header — title left, back right */}
        <header>
          <h1>Rooms</h1>
        </header>

        <RoomForm />

        <div className="space-y-4">
          <h2>All Rooms</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-2.5 text-left font-medium">Name</th>
                  <th className="px-4 py-2.5 text-left font-medium">
                    Submissions
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room: { id: string; name: string; _count: { submissions: number } }) => (
                  <tr
                    key={room.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-2.5 font-medium">{room.name}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {room._count.submissions}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <RoomActions
                        roomId={room.id}
                        submissionCount={room._count.submissions}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
