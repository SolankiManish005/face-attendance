import mongoose, { Document } from "mongoose";

export interface ICompany extends Document {
  name: string;
  email: string;
  password: string;
}

const companySchema = new mongoose.Schema<ICompany>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

export default mongoose.model<ICompany>("Company", companySchema);