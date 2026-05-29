import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../types";

export const auth = (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Access denied" });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    req.companyId = decoded.companyId;
    next();
};
