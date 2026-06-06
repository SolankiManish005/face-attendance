import { Response } from "express";
import Employee from "../models/employee.model";
import { AuthRequest } from "../types";
import { extractDescriptor } from "../utils/face.util";

export const registerEmployee = async (req: AuthRequest, res: Response) => {
    try {
        const { name, employeeId } = req.body;
        const file = (req as any).file;

        console.log(`[EMPLOYEE] Register attempt - name: ${name}, employeeId: ${employeeId}, companyId: ${req.companyId}`);

        if (!name || !employeeId) {
            console.log(`[EMPLOYEE] ❌ Missing fields - name: ${name}, employeeId: ${employeeId}`);
            return res.status(400).json({ message: "Name and employeeId are required" });
        }
        if (!file) {
            console.log(`[EMPLOYEE] ❌ No image uploaded`);
            return res.status(400).json({ message: "Face image is required" });
        }

        console.log(`[EMPLOYEE] Image received - size: ${(file.size / 1024).toFixed(1)}KB`);

        const descriptor = await extractDescriptor(file.buffer);
        if (!descriptor) {
            console.log(`[EMPLOYEE] ❌ No face detected in image for: ${name}`);
            return res.status(400).json({ message: "No face detected in image. Please retake the photo." });
        }

        console.log(`[EMPLOYEE] Face descriptor extracted - length: ${descriptor.length}`);

        const existing = await Employee.findOne({ employeeId, companyId: req.companyId });
        if (existing) {
            console.log(`[EMPLOYEE] ❌ Employee ID already exists: ${employeeId}`);
            return res.status(400).json({ message: "Employee ID already exists" });
        }

        const employee = await Employee.create({
            name,
            employeeId,
            companyId: req.companyId,
            descriptors: [descriptor]
        });

        console.log(`[EMPLOYEE] ✅ Employee registered - name: ${name}, employeeId: ${employeeId}`);
        res.status(201).json({ message: "Employee registered successfully", employee });
    } catch (error) {
        console.error("[EMPLOYEE] ❌ Register error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getEmployees = async (req: AuthRequest, res: Response) => {
    try {
        console.log(`[EMPLOYEE] Get employees - companyId: ${req.companyId}`);
        const employees = await Employee.find({ companyId: req.companyId }, { descriptors: 0 });
        console.log(`[EMPLOYEE] ✅ Found ${employees.length} employees`);
        res.json(employees);
    } catch (error) {
        console.error("[EMPLOYEE] ❌ Get employees error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
