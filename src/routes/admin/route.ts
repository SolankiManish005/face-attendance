import type { App } from "@/pkg/hono/app";
import { registerV1ApiAddUserWithFaceImages } from "@/routes/admin/v1_api_add_user_with_face_images";
import { registerV1ApiGetAttendanceExcelSheet } from "@/routes/admin/v1_api_get_attendance_excel_sheet";
import { registerV1ApiGetUserAttendanceReportByType } from "@/routes/admin/v1_api_get_user_attendance_report_by_type";
import { registerV1ApiGetLeavesByFilter } from "@/routes/admin/v1_api_leave_report_type";
import { registerV1ApiListAllUserAccount } from "@/routes/admin/v1_api_list_all_user_account";
import { registerV1ApiListLatestAttendanceForAllUser } from "@/routes/admin/v1_api_list_latest_attendance_for_all_user";
import { registerV1ApiListLatestAttendanceForUserByPublicId } from "@/routes/admin/v1_api_list_latest_attendance_for_user_by_public_id";
import { registerV1ApiMaintenanceBackupPostgresDatabase } from "@/routes/admin/v1_api_maintenance_backup_postgres_database";
import { registerV1ApiMatchFaceAgainstAccount } from "@/routes/admin/v1_api_match_face_against_account";
import { registerV1ApiUserCheckInOrCheckOutWithFace } from "@/routes/admin/v1_api_user_check_in_or_check_out_with_face";
import { registerV1ApiAddNewUserFace } from "./v1_api_add_new_user_face";
import { registerV1ApiDeleteUser } from "./v1_api_delete_user";

export const setupAdminApiRoutes = (app: App) => {
  registerV1ApiAddNewUserFace(app);
  registerV1ApiGetAttendanceExcelSheet(app);
  registerV1ApiMaintenanceBackupPostgresDatabase(app);
  registerV1ApiGetUserAttendanceReportByType(app);
  registerV1ApiListLatestAttendanceForUserByPublicId(app);
  registerV1ApiListLatestAttendanceForAllUser(app);
  registerV1ApiUserCheckInOrCheckOutWithFace(app);
  registerV1ApiListAllUserAccount(app);
  registerV1ApiMatchFaceAgainstAccount(app);
  registerV1ApiAddUserWithFaceImages(app);
  registerV1ApiGetLeavesByFilter(app);
  registerV1ApiDeleteUser(app);
};
