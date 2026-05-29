import { Response } from "express";
import Employee from "../models/employee.model";
import { AuthRequest } from "../types";
import { extractDescriptor } from "../utils/face.util";

export const registerEmployee = async (req: AuthRequest, res: Response) => {
    try {
        const { name, employeeId } = req.body;
        const file = (req as any).file;

        if (!name || !employeeId) return res.status(400).json({ message: "Name and employeeId are required" });
        if (!file) return res.status(400).json({ message: "Face image is required" });

        const descriptor = await extractDescriptor(file.buffer);
        if (!descriptor) return res.status(400).json({ message: "No face detected in image. Please retake the photo." });

        const existing = await Employee.findOne({ employeeId, companyId: req.companyId });
        if (existing) return res.status(400).json({ message: "Employee ID already exists" });

        const employee = await Employee.create({
            name,
            employeeId,
            companyId: req.companyId,
            descriptors: [descriptor]
        });

        res.status(201).json({ message: "Employee registered successfully", employee });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getEmployees = async (req: AuthRequest, res: Response) => {
    try {
        const employees = await Employee.find({ companyId: req.companyId }, { descriptors: 0 });
        res.json(employees);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};
