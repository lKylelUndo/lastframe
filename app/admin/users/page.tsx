import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { UserForm } from "./user-form";
import { UserActions } from "./user-actions";

export default async function AdminUsersPage() {
  await requireAdmin();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  return (
    <div className="min-h-svh px-5 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-2xl space-y-10">
        {/* Header — title left, back right */}
        <header>
          <h1>Users</h1>
        </header>

        <UserForm />

        <div className="space-y-4">
          <h2>All Users</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-2.5 text-left font-medium">Name</th>
                  <th className="px-4 py-2.5 text-left font-medium">Email</th>
                  <th className="px-4 py-2.5 text-left font-medium">Role</th>
                  <th className="px-4 py-2.5 text-left font-medium">Status</th>
                  <th className="px-4 py-2.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user: { id: string; name: string; email: string; role: string; isActive: boolean }) => (
                  <tr
                    key={user.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-2.5 font-medium">{user.name}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {user.email}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {user.role}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          user.isActive
                            ? "bg-muted text-foreground"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <UserActions
                        userId={user.id}
                        isActive={user.isActive}
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
