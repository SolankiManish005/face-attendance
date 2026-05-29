import mongoose, { Document } from "mongoose";

interface IAttendance extends Document {
    employeeId: string;
    companyId: mongoose.Types.ObjectId;
    date: string;
    checkIn: string;
    checkOut?: string;
}

const attendanceSchema = new mongoose.Schema<IAttendance>({
    employeeId: { type: String, required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, required: true },
    date: { type: String, required: true },
    checkIn: { type: String, required: true },
    checkOut: { type: String },
});

export default mongoose.model<IAttendance>("Attendance", attendanceSchema);
