import { eq, isNull } from "drizzle-orm";
import { db } from "./src/database/index";
import { accounts } from "./src/database/schema";

async function updateNullBioIds() {
  try {
    const usersWithNullBioId = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(isNull(accounts.bioId));

    for (const user of usersWithNullBioId) {
      const newBioId = `BIO${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      await db.update(accounts).set({ bioId: newBioId }).where(eq(accounts.id, user.id));
    }
  } catch (error) {
    console.error("Error updating bio_id values:", error);
  }
}

updateNullBioIds();
