import { schema } from "@/database";
import type { Database } from "@/database/db";
import { dateToDateOnlyString, dateToISOLikeLocal } from "@/pkg/utils/date";
import { type TypeId, typeIdToUUID } from "@/pkg/utils/typeid";
import { and, count, countDistinct, desc, eq, isNull, max, min, or, sql, sum } from "drizzle-orm";

export class DatabaseService {
  static serviceWithTransaction(db: Database) {
    return new DatabaseService(db);
  }

  constructor(private db: Database) {
    this.db = db;
  }

  public async getAccountLastCheckInWithoutCheckOutForDate(
    publicId: TypeId<"account"> | string,
    date: Date,
  ) {
    return this.db
      .select({
        id: schema.attendance.id,
        checkIn: schema.attendance.checkIn,
        checkOut: schema.attendance.checkOut,
        hasPreviousDayCheckInWithoutCheckOut: sql<boolean>`
          EXISTS (
            SELECT 1
            FROM ${schema.attendance}
            WHERE
              ${schema.attendance.accountPublicId} = ${typeIdToUUID(publicId)}
              AND ${schema.attendance.checkIn}::date = ${dateToDateOnlyString(date)}::date - INTERVAL '1 day'
              AND ${schema.attendance.checkOut} IS NULL
          )
        `,
      })
      .from(schema.attendance)
      .where(
        and(
          eq(schema.attendance.accountPublicId, publicId as any),
          or(
            eq(sql`date_trunc('day', check_out)`, sql`${dateToDateOnlyString(date)}::date`),
            eq(sql`date_trunc('day', check_in)`, sql`${dateToDateOnlyString(date)}::date`),
            sql`date_trunc('day', check_in) = ${dateToDateOnlyString(date)}::date - INTERVAL '1 day'`,
          ),
          isNull(schema.attendance.checkOut),
        ),
      )
      .limit(1)
      .orderBy(desc(schema.attendance.checkOut), desc(schema.attendance.checkIn))
      .execute()
      .then((res) => res[0]);
  }

  public getAccountDetailsByPublicId(publicId: TypeId<"account"> | string, companyId?: string) {
    return this.db.query.accounts.findFirst({
      columns: {
        firstName: true,
        lastName: true,
        department: true,
        designation: true,
        publicId: true,
        dob: true,
        bioId: true,
        companyId: true,
      },
      where: (accounts, { eq, and }) => {
        const filters = [eq(accounts.publicId, publicId as any)];
        if (companyId) {
          filters.push(eq(accounts.companyId, companyId));
        }
        return and(...filters);
      },
    });
  }

  public async addAttendanceCheckIn(
    publicId: TypeId<"account"> | string,
    date: Date,
    companyId?: string | null,
  ) {
    return await this.db
      .insert(schema.attendance)
      .values({
        accountPublicId: publicId as any,
        checkIn: sql`${dateToISOLikeLocal(date)}`,
        companyId: companyId,
      })
      .returning({
        id: schema.attendance.id,
      })
      .execute()
      .then((res) => res[0]);
  }

  public async addAttendanceCheckOutById(attendanceId: number, date: Date) {
    return await this.db
      .update(schema.attendance)
      .set({
        checkOut: sql`${dateToISOLikeLocal(date)}`,
      })
      .where(eq(schema.attendance.id, attendanceId))
      .execute();
  }

  /**
   * @description
   */
  public async getAccountAttendanceDailyStatsByAccountPublicId(
    publicId: TypeId<"account"> | string,
  ) {
    const dailyStats = this.db.$with("dailyStats").as(
      this.db
        .select({
          publicId: schema.accounts.publicId,
          firstName: schema.accounts.firstName,
          lastName: schema.accounts.lastName,
          bioId: schema.accounts.bioId,
          workDate: sql<Date>`${schema.attendance.checkIn}::date`.as("work_date"),
          checkInTime: sql<string>`TO_CHAR(${schema.attendance.checkIn}, 'HH24:MI:SS')`.as(
            "check_in_time",
          ),
          checkOutTime: sql<string>`TO_CHAR(${schema.attendance.checkOut}, 'HH24:MI:SS')`.as(
            "check_out_time",
          ),
          hoursWorked: sql<string>`
          CASE 
            WHEN ${schema.attendance.checkOut} IS NOT NULL 
            THEN ROUND(EXTRACT(EPOCH FROM (${schema.attendance.checkOut} - ${schema.attendance.checkIn}))/3600, 2)
            ELSE NULL
        END `.as("hours_worked"),
        })
        .from(schema.attendance)
        .where(eq(schema.attendance.accountPublicId, publicId as any))
        .innerJoin(
          schema.accounts,
          eq(schema.attendance.accountPublicId, schema.accounts.publicId),
        ),
    );

    return await this.db
      .with(dailyStats)
      .select({
        publicId: dailyStats.publicId,
        firstName: dailyStats.firstName,
        lastName: dailyStats.lastName,
        bioId: dailyStats.bioId,
        workDate: dailyStats.workDate,
        totalEntries: count(),
        timeLog: sql<string>`STRING_AGG(${dailyStats.checkInTime} || ' - ' || COALESCE(${dailyStats.checkOutTime}, 'In Progress'), ', ')`,
        totalHoursWorked: sum(dailyStats.hoursWorked),
        avgHoursPerEntry: sql<number>`ROUND(AVG(${dailyStats.hoursWorked}), 2)`,
      })
      .from(dailyStats)
      .groupBy(
        dailyStats.publicId,
        dailyStats.workDate,
        dailyStats.firstName,
        dailyStats.lastName,
        dailyStats.bioId,
      )
      .orderBy(desc(dailyStats.workDate))
      .execute();
  }

  public async getAccountAttendanceWeeklyStatsByAccountPublicId(
    publicId: TypeId<"account"> | string,
  ) {
    const weeklyStats = this.db.$with("weeklyStats").as(
      this.db
        .select({
          publicId: schema.accounts.publicId,
          firstName: schema.accounts.firstName,
          lastName: schema.accounts.lastName,
          bioId: schema.accounts.bioId,
          weekStart: sql<Date>`DATE_TRUNC('week', ${schema.attendance.checkIn})`.as("week_start"),
          weekEnd:
            sql<Date>`(DATE_TRUNC('week', ${schema.attendance.checkIn}) + INTERVAL '6 days')::date`.as(
              "week_end",
            ),
          checkInTime: schema.attendance.checkIn,
          checkOutTime: schema.attendance.checkOut,
          hoursWorked: sql<string>`
            CASE 
              WHEN ${schema.attendance.checkOut} IS NOT NULL 
              THEN EXTRACT(EPOCH FROM (${schema.attendance.checkOut} - ${schema.attendance.checkIn}))/3600
              ELSE NULL
            END
          `.as("hours_worked"),
        })
        .from(schema.attendance)
        .where(eq(schema.attendance.accountPublicId, publicId as any))
        .innerJoin(
          schema.accounts,
          eq(schema.attendance.accountPublicId, schema.accounts.publicId),
        ),
    );

    return await this.db
      .with(weeklyStats)
      .select({
        publicId: weeklyStats.publicId,
        firstName: weeklyStats.firstName,
        lastName: weeklyStats.lastName,
        bioId: weeklyStats.bioId,
        weekStart: sql<string>`${weeklyStats.weekStart}::date`,
        weekEnd: sql<string>`${weeklyStats.weekEnd}::date`,
        totalEntries: count(),
        daysWorked: countDistinct(sql`${weeklyStats.checkInTime}::date`),
        totalHours: sql<number>`ROUND(SUM(${weeklyStats.hoursWorked}), 2)`,
        earliestCheckIn: sql<string>`MIN(${weeklyStats.checkInTime})`,
        latestCheckOut: sql<string>`MAX(${weeklyStats.checkOutTime})`,
      })
      .from(weeklyStats)
      .groupBy(
        weeklyStats.publicId,
        weeklyStats.firstName,
        weeklyStats.lastName,
        weeklyStats.bioId,
        weeklyStats.weekStart,
        weeklyStats.weekEnd,
      )
      .orderBy(desc(weeklyStats.weekStart))
      .execute();
  }

  public async getAccountAttendanceMonthlyStatsByAccountPublicId(
    publicId: TypeId<"account"> | string,
  ) {
    const monthlyStats = this.db.$with("monthlyStats").as(
      this.db
        .select({
          publicId: schema.accounts.publicId,
          firstName: schema.accounts.firstName,
          lastName: schema.accounts.lastName,
          bioId: schema.accounts.bioId,
          monthStart: sql<Date>`DATE_TRUNC('month', ${schema.attendance.checkIn})`.as(
            "month_start",
          ),
          checkIn: schema.attendance.checkIn,
          checkOut: schema.attendance.checkOut,
          hoursWorked: sql<string>`
            CASE 
              WHEN ${schema.attendance.checkOut} IS NOT NULL 
              THEN EXTRACT(EPOCH FROM (${schema.attendance.checkOut} - ${schema.attendance.checkIn}))/3600
              ELSE NULL
            END
          `.as("hours_worked"),
        })
        .from(schema.attendance)
        .where(eq(schema.attendance.accountPublicId, publicId as any))
        .innerJoin(
          schema.accounts,
          eq(schema.attendance.accountPublicId, schema.accounts.publicId),
        ),
    );

    return await this.db
      .with(monthlyStats)
      .select({
        publicId: monthlyStats.publicId,
        firstName: monthlyStats.firstName,
        lastName: monthlyStats.lastName,
        bioId: monthlyStats.bioId,
        month: sql<string>`TO_CHAR(${monthlyStats.monthStart}, 'YYYY-MM')`.as("month"),
        totalEntries: count(),
        daysWorked: countDistinct(sql<Date>`${monthlyStats.checkIn}::date`),
        totalHoursWorked: sum(monthlyStats.hoursWorked),
        earliestCheckIn: min(sql<string>`TO_CHAR(${monthlyStats.checkIn}, 'HH24:MI:SS')`),
        latestCheckOut: max(sql<string>`TO_CHAR(${monthlyStats.checkOut}, 'HH24:MI:SS')`),
      })
      .from(monthlyStats)
      .groupBy(
        monthlyStats.publicId,
        monthlyStats.monthStart,
        monthlyStats.firstName,
        monthlyStats.lastName,
        monthlyStats.bioId,
      )
      .orderBy(desc(monthlyStats.monthStart))
      .execute();
  }
}
// export const dbService = new DatabaseService(db);
