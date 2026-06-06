import { Response } from "express";
import Employee from "../models/employee.model";
import Attendance from "../models/attendance.model";
import { isMatch } from "../utils/vector.util";
import { AuthRequest } from "../types";
import { extractDescriptor } from "../utils/face.util";
import mongoose from "mongoose";

export const getAttendance = async (req: AuthRequest, res: Response) => {
    try {
        console.log(`[ATTENDANCE] Get records - companyId: ${req.companyId}`);
        const records = await Attendance.find({ companyId: new mongoose.Types.ObjectId(req.companyId) })
            .sort({ date: -1, checkIn: -1 });
        console.log(`[ATTENDANCE] ✅ Found ${records.length} records`);
        res.json(records);
    } catch (error) {
        console.error("[ATTENDANCE] ❌ Get attendance error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const markAttendance = async (req: AuthRequest, res: Response) => {
    try {
        const file = (req as any).file;
        if (!file) {
            console.log(`[ATTENDANCE] ❌ No image uploaded`);
            return res.status(400).json({ message: "Face image is required" });
        }

        console.log(`[ATTENDANCE] Image received - size: ${(file.size / 1024).toFixed(1)}KB, companyId: ${req.companyId}`);

        const descriptor = await extractDescriptor(file.buffer);
        if (!descriptor) {
            console.log(`[ATTENDANCE] ❌ No face detected in image`);
            return res.status(400).json({ message: "No face detected in image. Please retake the photo." });
        }

        console.log(`[ATTENDANCE] Face descriptor extracted - searching employees...`);

        const companyId = req.companyId;
        const employees = await Employee.find({ companyId: new mongoose.Types.ObjectId(companyId) });
        console.log(`[ATTENDANCE] Found ${employees.length} employees to match against`);

        for (const emp of employees) {
            const plainDescriptors = emp.descriptors.map(d => Array.from(d));
            const matched = isMatch(descriptor, plainDescriptors);

            if (matched) {
                console.log(`[ATTENDANCE] ✅ Face matched - employee: ${emp.name} (${emp.employeeId})`);
                const today = new Date().toISOString().split("T")[0];

                let record = await Attendance.findOne({
                    employeeId: emp.employeeId,
                    date: today,
                    companyId,
                    checkOut: { $exists: false }
                }).sort({ checkIn: -1 });

                if (!record) {
                    record = await Attendance.create({
                        employeeId: emp.employeeId,
                        companyId,
                        date: today,
                        checkIn: new Date().toLocaleTimeString()
                    });
                    console.log(`[ATTENDANCE] ✅ Check-in recorded - employee: ${emp.name}, time: ${record.checkIn}`);
                    return res.json({ message: "Check-in successful", attendance: emp });
                } else {
                    record.checkOut = new Date().toLocaleTimeString();
                    await record.save();
                    console.log(`[ATTENDANCE] ✅ Check-out recorded - employee: ${emp.name}, time: ${record.checkOut}`);
                    return res.json({ message: "Check-out successful", attendance: emp });
                }
            }
        }

        console.log(`[ATTENDANCE] ❌ Face not recognized - companyId: ${companyId}`);
        res.status(404).json({ message: "Face not recognized" });
    } catch (error) {
        console.error("[ATTENDANCE] ❌ Mark attendance error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
