import { Request, Response } from "express";
import Company from "../models/company.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const registerCompany = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;
        console.log(`[AUTH] Register attempt - email: ${email}`);

        const existing = await Company.findOne({ email });
        if (existing) {
            console.log(`[AUTH] Register failed - company already exists: ${email}`);
            return res.status(400).json({ message: "Company already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const company = await Company.create({ name, email, password: hashedPassword });

        console.log(`[AUTH] ✅ Company registered - name: ${name}, email: ${email}`);
        res.status(200).json({ message: "Company Registered", company });
    } catch (error) {
        console.error("[AUTH] ❌ Register error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const loginCompany = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        console.log(`[AUTH] Login attempt - email: ${email}`);

        const company = await Company.findOne({ email });
        if (!company) {
            console.log(`[AUTH] Login failed - company not found: ${email}`);
            return res.status(400).json({ message: "Company not found" });
        }

        const isMatch = await bcrypt.compare(password, company.password);
        if (!isMatch) {
            console.log(`[AUTH] Login failed - invalid password for: ${email}`);
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign({ companyId: company._id }, process.env.JWT_SECRET!, { expiresIn: "1d" });

        console.log(`[AUTH] ✅ Login success - company: ${company.name} (${email})`);
        res.status(200).json({ message: "Login success", token, companyId: company._id });
    } catch (error) {
        console.error("[AUTH] ❌ Login error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
