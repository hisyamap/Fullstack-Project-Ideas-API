import mongoose, { Document, ObjectId, Schema } from "mongoose";

export interface IProject extends Document {
    name: string;
    description: string;
    difficulty: string;
    likes: number;
    user: ObjectId;
    stack: { frontend: string; backend: string; api: string; } [];
}

const ProjectSchema: Schema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    difficulty: { type: String, required: true, enum: ["easy", "medium", "hard"]},
    likes: { type: Number, default: 0 },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    stack: [{ 
        frontend: { type: String, required: true }, 
        backend: { type: String, required: true }, 
        api: { type: String, required: false },
        _id: false
    }]
},
{ timestamps: true })

const Project = mongoose.model<IProject>("Project", ProjectSchema);

export default Project