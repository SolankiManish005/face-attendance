import cron from "node-cron";
import { autoMarkLeavesForNoAttendance } from "../cron/auto-mark-leaves";

// Run every 10 seconds
// cron.schedule('*/10 * * * * *', async () => {

// Run every (every 2 hours)
cron.schedule(
  "0 */2 * * *",
  async () => {
    try {
      await autoMarkLeavesForNoAttendance();
    } catch (error) {
      console.error("Error occurred during cron job execution: ", error);
    }
  },
  {
    timezone: "UTC", // Optional: set the timezone to avoid any unexpected timing issues
  },
);
