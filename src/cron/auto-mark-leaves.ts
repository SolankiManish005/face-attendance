import { db } from "@/database";
import { accounts, attendance as attendances, leaves } from "@/database/schema";
import { and, eq, gte, lt, or } from "drizzle-orm";

export const autoMarkLeavesForNoAttendance = async () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr: any = yesterday.toISOString().split("T")[0];

  // Define start and end time for the window (7 AM to 9 PM)
  const start = new Date(`${dateStr}T07:00:00.000Z`);
  const end = new Date(`${dateStr}T21:00:00.000Z`);

  // Get all accounts
  const allAccounts = await db.select({ accountPublicId: accounts.publicId }).from(accounts);

  for (const acc of allAccounts) {
    // Fetch attendance for the given date range, including checkIn and checkOut
    const [attendance] = await db
      .select()
      .from(attendances)
      .where(
        and(
          eq(attendances.accountPublicId, acc.accountPublicId),
          or(
            and(gte(attendances.checkIn, start), lt(attendances.checkIn, end)),
            and(gte(attendances.checkOut, start), lt(attendances.checkOut, end)),
          ),
        ),
      );

    // Skip the account if there is any attendance (checkIn or checkOut exists)
    if (attendance && (attendance.checkIn || attendance.checkOut)) {
      continue;
    }

    // Fetch leave if exists for the same day
    const [leave] = await db
      .select({
        createdAt: leaves.createdAt,
        updatedAt: leaves.updatedAt,
        accountPublicId: leaves.accountPublicId,
        leaveDate: leaves.leaveDate,
      })
      .from(leaves)
      .where(
        and(
          eq(leaves.accountPublicId, acc.accountPublicId),
          eq(leaves.leaveDate, dateStr as string),
        ),
      );

    // If there's no attendance and no leave, insert a leave
    const hasNoLeave = !leave;

    if (hasNoLeave) {
      // Insert leave if no leave record exists
      await db.insert(leaves).values({
        accountPublicId: acc.accountPublicId, // ✅ Must match schema field name
        leaveDate: dateStr,
      });
    }
  }
};
