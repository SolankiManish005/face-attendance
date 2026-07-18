#!/usr/bin/env tsx

/**
 * Script to validate improved face handling across multiple companies
 */

import { db } from "@/database";
import { accounts } from "@/database/schema";
import { eq } from "drizzle-orm";

async function validateFaceHandling() {
  console.log("🔍 Validating face handling across companies...\n");

  // Find users with same email but different companies
  const duplicateEmailUsers = await db
    .select({
      publicId: accounts.publicId,
      email: accounts.email,
      companyId: accounts.companyId,
      firstName: accounts.firstName,
      lastName: accounts.lastName,
      labelFaceDescriptorsString: accounts.labelFaceDescriptorsString,
    })
    .from(accounts)
    .where(eq(accounts.role, "user"));

  const emailGroups = duplicateEmailUsers.reduce(
    (acc, user) => {
      if (!acc[user.email]) {
        acc[user.email] = [];
      }
      acc[user.email]!.push(user);
      return acc;
    },
    {} as Record<string, typeof duplicateEmailUsers>,
  );

  console.log("📊 Analysis Results:");
  console.log("===================");

  let multiCompanyUsers = 0;
  let usersWithFaceData = 0;
  let potentialIssues = 0;

  for (const [email, users] of Object.entries(emailGroups)) {
    if (users.length > 1) {
      const first = users[0];
      if (!first) continue;
      console.log(`\n👤 User: ${first.firstName} ${first.lastName} (${email})`);
      multiCompanyUsers++;
      console.log(`   Companies: ${users.map((u) => u.companyId).join(", ")}`);

      const usersWithFaces = users.filter(
        (u) => u.labelFaceDescriptorsString && u.labelFaceDescriptorsString !== "{}",
      );
      usersWithFaceData += usersWithFaces.length;

      if (usersWithFaces.length > 0) {
        console.log(`   ✅ Face data preserved: ${usersWithFaces.length}/${users.length} accounts`);

        // Check if face descriptors are consistent
        const faceDescriptors = usersWithFaces.map((u) => u.labelFaceDescriptorsString);
        const uniqueDescriptors = [...new Set(faceDescriptors)];

        if (uniqueDescriptors.length > 1) {
          potentialIssues++;
          console.log(`   ⚠️  Warning: Inconsistent face data across companies`);
        } else {
          console.log(`   ✅ Face data consistent across companies`);
        }
      } else {
        console.log(`   ❌ No face data found`);
      }
    }
  }

  console.log("\n📈 Summary:");
  console.log("===========");
  console.log(`Total users: ${duplicateEmailUsers.length}`);
  console.log(`Multi-company users: ${multiCompanyUsers}`);
  console.log(`Users with face data: ${usersWithFaceData}`);
  console.log(`Potential issues: ${potentialIssues}`);

  if (potentialIssues === 0 && multiCompanyUsers > 0) {
    console.log("\n🎉 All multi-company users have consistent face data!");
  } else if (potentialIssues > 0) {
    console.log("\n⚠️  Some users may have inconsistent face data across companies.");
    console.log("   Consider running face data synchronization.");
  }

  process.exit(0);
}

validateFaceHandling().catch(console.error);
