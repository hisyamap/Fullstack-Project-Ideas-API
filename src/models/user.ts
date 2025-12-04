import mongoose, { Document, ObjectId, Schema } from 'mongoose';
import crypto from 'crypto';

export interface IUser extends Document {
    username: string;
    email: string;
    imageUrl: string;
    ideas: number;
    setPassword:  (password: string) => void;
    valPassword:  (password: string) => boolean;
}

const UserSchema: Schema = new Schema({
    username: { type: String, required: true},
    email: { type: String, required: true, unique: true },
    imageUrl: { type: String, required: false },
    ideas: { type: Number, default: 0 },
    passwordHash: { type: String, required: true },
    passwordSalt: { type: String, required: true },
})

UserSchema.methods.setPassword = function(password: string) {
    this.passwordSalt = crypto.randomBytes(16).toString('hex');
    this.passwordHash = crypto.pbkdf2Sync(password, this.passwordSalt, 1000, 64, "sha512").toString('hex');

    return;
}

UserSchema.methods.valPassword = function(password: string) {
    const hash = crypto.pbkdf2Sync(password, this.passwordSalt, 1000, 64, "sha512").toString('hex');

    return this.passwordHash === hash;
}

export default mongoose.model<IUser>("User", UserSchema);

