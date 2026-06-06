import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../types";

export const auth = (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        console.log(`[AUTH] ❌ No token provided - ${req.method} ${req.path}`);
        return res.status(401).json({ message: "Access denied" });
    }

    try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
        req.companyId = decoded.companyId;
        console.log(`[AUTH] ✅ Token verified - companyId: ${decoded.companyId} - ${req.method} ${req.path}`);
        next();
    } catch (error) {
        console.log(`[AUTH] ❌ Invalid token - ${req.method} ${req.path}`);
        return res.status(401).json({ message: "Invalid token" });
    }
};
