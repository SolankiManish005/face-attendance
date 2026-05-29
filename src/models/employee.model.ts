import mongoose, { Document } from "mongoose";

interface IEmployee extends Document {
    name: string;
    employeeId: string;
    companyId: mongoose.Types.ObjectId;
    descriptors: number[][];
}

const employeeSchema = new mongoose.Schema<IEmployee>({
    name: String,
    employeeId: String,
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
    },
    descriptors: { type: [[Number]], default: [] }
});

export default mongoose.model<IEmployee>('Employee', employeeSchema);