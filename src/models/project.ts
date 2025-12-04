import mongoose, { Document, ObjectId, Schema } from "mongoose";

export interface IProject extends Document {
    name: string;
    description: string;
    difficulty: string;
    date: Date;
    likes: number;
    user: ObjectId;
    stack: { frontend: string; backend: string; api: string; } [];
}

const ProjectSchema: Schema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    difficulty: { type: String, required: true, enum: ["easy", "medium", "hard"]},
    date: { type: Date, default:Date.now },
    likes: { type: Number, default: 0 },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    stack: [{ 
        frontend: { type: String, required: true }, 
        backend: { type: String, required: true }, 
        api: { type: String, required: true } 
    }]
})

export default mongoose.model<IProject>("Project", ProjectSchema);