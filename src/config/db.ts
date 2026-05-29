import mongoose from "mongoose";

export const connectDB = async () => {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI is not defined");
    const parsed = new URL(uri);
    if (!["mongodb:", "mongodb+srv:"].includes(parsed.protocol)) {
        throw new Error("Invalid MONGODB_URI protocol");
    }
    await mongoose.connect(uri);
    console.log("MongoDB connected");
};
