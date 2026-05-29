import { Request, Response } from "express";
import Company from "../models/company.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const registerCompany = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;

        const existing = await Company.findOne({ email })
        if(existing) return res.status(400).json({message: "Company already exists"});

        const hashedPassword = await bcrypt.hash(password, 10);

        const company = await Company.create({ name, email, password: hashedPassword });

        res.status(200).json({ message: "Company Registered", company});
    } catch (error) {
        res.status(500).json({message: "Internal server error"});
    }
};

export const loginCompany = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const company = await Company.findOne({ email })
        if(!company) return res.status(400).json({message: "Company not found"});

        const isMatch = await bcrypt.compare(password, company.password);
        if(!isMatch) return res.status(400).json({message: "Invalid credentials"});

        const token = jwt.sign({companyId: company._id}, process.env.JWT_SECRET!, {expiresIn: "1d"});

        res.status(200).json({message: "Login success", token, companyId: company._id});
    } catch (error) {
        res.status(500).json({message: "Internal server error"});
    }
};