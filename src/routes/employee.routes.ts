import express from "express";
import { registerEmployee, getEmployees } from "../controllers/employee.controller";
import { auth } from "../middleware/auth.middleware";
import multer from "multer";

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (_, file, cb) => {
        if (file.mimetype.startsWith("image/")) cb(null, true);
        else cb(new Error("Only image files are allowed"));
    }
});

const router = express.Router();

router.get("/", auth, getEmployees);
router.post("/", auth, upload.single("image"), registerEmployee);

export default router;
