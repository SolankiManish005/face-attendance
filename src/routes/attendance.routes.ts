import express from "express";
import { markAttendance, getAttendance } from "../controllers/attendance.controller";
import { auth } from "../middleware/auth.middleware";
import multer from "multer";

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_, file, cb) => {
        if (file.mimetype.startsWith("image/")) cb(null, true);
        else cb(new Error("Only image files are allowed"));
    }
});

const router = express.Router();

router.get("/", auth, getAttendance);
router.post("/", auth, upload.single("image"), markAttendance);

export default router;
