import { Response } from "express";
import Employee from "../models/employee.model";
import Attendance from "../models/attendance.model";
import { isMatch } from "../utils/vector.util";
import { AuthRequest } from "../types";
import { extractDescriptor } from "../utils/face.util";
import mongoose from "mongoose";

export const getAttendance = async (req: AuthRequest, res: Response) => {
    try {
        const records = await Attendance.find({ companyId: new mongoose.Types.ObjectId(req.companyId) })
            .sort({ date: -1, checkIn: -1 });
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

export const markAttendance = async (req: AuthRequest, res: Response) => {
    try {
        const file = (req as any).file;
        if (!file) return res.status(400).json({ message: "Face image is required" });

        const descriptor = await extractDescriptor(file.buffer);
        if (!descriptor) return res.status(400).json({ message: "No face detected in image. Please retake the photo." });

        const companyId = req.companyId;
        const employees = await Employee.find({ companyId: new mongoose.Types.ObjectId(companyId) });

        for (const emp of employees) {
            const plainDescriptors = emp.descriptors.map(d => Array.from(d));
            const matched = isMatch(descriptor, plainDescriptors);

            if (matched) {
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
                    return res.json({ message: "Check-in successful", attendance: emp });
                } else {
                    record.checkOut = new Date().toLocaleTimeString();
                    await record.save();
                    return res.json({ message: "Check-out successful", attendance: emp });
                }
            }
        }

        res.status(404).json({ message: "Face not recognized" });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};
