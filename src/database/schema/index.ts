import { commonTableColumns } from "@/database/utils";
import { typeIdDataType as publicId } from "@/pkg/utils/typeid";
import { isNotNull, relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  date,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const roleEnum = ["user", "admin"] as const;
export type Role = (typeof roleEnum)[number];

const foreignKey = (columnName: string) => integer(columnName);

// TODO: add indexes and foreign keys
// show timezone;
// set TIMEZONE To 'Asia/Kolkata';

export const bloodGroupEnum = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export type BloodGroup = (typeof bloodGroupEnum)[number];

export const accounts = pgTable(
  "accounts",
  {
    ...commonTableColumns,
    publicId: publicId("account", "public_id").notNull(),
    firstName: varchar("first_name").notNull(),
    lastName: varchar("last_name"),
    email: varchar("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    role: varchar("role", { enum: roleEnum }).notNull().default("user"),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    lastLoginAt: bigint("last_login_at", { mode: "number" }),
    mobile: varchar("mobile", { length: 20 }).notNull(),
    dob: date("dob", { mode: "string" }).notNull(),
    bloodGroup: varchar("blood_group", { length: 5, enum: bloodGroupEnum }).notNull(),
    designation: varchar("designation", { length: 255 }).notNull(),
    department: varchar("department", { length: 255 }).notNull(),
    bioId: varchar("bio_id", { length: 255 })
      .notNull()
      .$defaultFn(() => `BIO${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`),
    companyId: varchar("company_id", { length: 255 }),
    labelFaceDescriptorsString: text("label_face_descriptors_string").$defaultFn(() => "{}"),
  },
  (t) => ({
    publicIdIndex: uniqueIndex("public_id_idx_acc").on(t.publicId),
    emailIndex: uniqueIndex("email_idx").on(t.email),
    roleMobileIndex: uniqueIndex("role_mobile_idx").on(t.role, t.mobile).where(isNotNull(t.mobile)),
    bioIdIndex: uniqueIndex("bio_id_idx").on(t.bioId),
  }),
);

export const accountRelations = relations(accounts, (r) => ({
  sessions: r.many(sessions),
  faces: r.many(faces),
  attendance: r.many(attendance),
}));

export type AccountDbType = typeof accounts.$inferSelect;
export type InsertAccountDbType = typeof accounts.$inferInsert;

/**
 * @description not used with firebase auth
 */
export const sessions = pgTable(
  "sessions",
  {
    ...commonTableColumns,
    publicId: publicId("accountSession", "public_id").notNull(),
    accountId: foreignKey("account_id").notNull(),
    accountPublicId: publicId("account", "account_public_id").notNull(),
    sessionToken: varchar("session_token", { length: 255 }).notNull(),
    device: varchar("device", { length: 255 }).notNull(),
    os: varchar("os", { length: 255 }).notNull(),
    expiresAt: bigint("expires_at", { mode: "number" }).notNull(),
  },
  (t) => ({
    publicIdIndex: index("public_id_idx_ses").on(t.publicId),
    accountIdIndex: index("account_id_idx").on(t.accountId),
    sessionTokenIndex: uniqueIndex("session_token_idx").on(t.sessionToken),
    expiresAtIndex: uniqueIndex("expires_at_idx").on(t.expiresAt),
  }),
);

export const sessionRelations = relations(sessions, (r) => ({
  account: r.one(accounts, {
    fields: [sessions.accountId],
    references: [accounts.id],
  }),
}));

/**
 * @description
 */
export const faces = pgTable(
  "faces",
  {
    ...commonTableColumns,
    accountPublicId: publicId("account", "account_public_id").notNull(),
    faceImage: text("face_image").notNull(),
    descriptorString: text("descriptor_string").notNull(),
    companyId: varchar("company_id", { length: 255 }),
  },
  (t) => ({
    accountPublicIdIndex: index("account_public_id_idx").on(t.accountPublicId),
    faceImageIndex: uniqueIndex("face_image_idx").on(t.faceImage),
    companyIdIndex: index("company_id_idx").on(t.companyId),
  }),
);

export const faceRelations = relations(faces, (r) => ({
  account: r.one(accounts, {
    fields: [faces.accountPublicId],
    references: [accounts.publicId],
  }),
}));

/**
 * @description
 */
export const attendance = pgTable("attendance", {
  ...commonTableColumns,
  accountPublicId: publicId("account", "account_public_id").notNull(),
  checkIn: timestamp("check_in", { mode: "date", withTimezone: false }).notNull(),
  checkOut: timestamp("check_out", { mode: "date", withTimezone: false }),
  companyId: varchar("company_id", { length: 255 }),
});

export const attendanceRelations = relations(attendance, (r) => ({
  account: r.one(accounts, {
    fields: [attendance.accountPublicId],
    references: [accounts.publicId],
  }),
}));

export const leaves = pgTable("leaves", {
  id: serial("id").primaryKey(),
  accountPublicId: publicId("account", "account_public_id").notNull(),
  leaveDate: date("leave_date", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
});
