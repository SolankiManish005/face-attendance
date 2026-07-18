import { db } from "./src/database/index.js";
import { accounts, attendance, faces, sessions, leaves } from "./src/database/schema/index.js";
import { eq } from "drizzle-orm";
import { rm } from "fs/promises";
import { join } from "path";

const email = process.argv[2];

if (!email) {
  console.error("Usage: npm run load-env -- tsx delete-user.ts user@example.com");
  process.exit(1);
}

try {
  // Get user details first
  const user = await db.query.accounts.findFirst({
    columns: { publicId: true, firstName: true, email: true },
    where: eq(accounts.email, email),
    with: {
      faces: { columns: { faceImage: true } },
    },
  });

  if (!user) {
    console.log(`❌ User with email ${email} not found`);
    process.exit(1);
  }

  console.log(`🔍 Found user: ${user.firstName} (${user.email})`);

  await db.transaction(async (trx) => {
    // Delete attendance records
    await trx.delete(attendance).where(eq(attendance.accountPublicId, user.publicId));
    console.log("✅ Deleted attendance records");

    // Delete leave records
    await trx.delete(leaves).where(eq(leaves.accountPublicId, user.publicId));
    console.log("✅ Deleted leave records");

    // Delete sessions
    await trx.delete(sessions).where(eq(sessions.accountPublicId, user.publicId));
    console.log("✅ Deleted session records");

    // Delete face records
    await trx.delete(faces).where(eq(faces.accountPublicId, user.publicId));
    console.log("✅ Deleted face records");

    // Delete user account
    await trx.delete(accounts).where(eq(accounts.email, email));
    console.log("✅ Deleted user account");
  });

  // Delete face image files
  for (const face of user.faces) {
    try {
      await rm(join("./uploads/faces", face.faceImage));
      console.log(`🗑️  Deleted face image: ${face.faceImage}`);
    } catch (err) {
      console.log(`⚠️  Could not delete face image: ${face.faceImage}`);
    }
  }

  console.log(`🎉 User ${email} and all related data deleted successfully`);
} catch (error) {
  console.error("❌ Error deleting user:", error);
  process.exit(1);
}
