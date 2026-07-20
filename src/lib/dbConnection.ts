import mongoose from 'mongoose';

export async function connectToDB() {
    try {
        (await mongoose.connect(process.env.MONGODB_URL as string)).connection;

        console.log('Connected to DB');
    } catch (error) {
        console.log('Error Connecting to DB', error);
        process.exit(1)
    }
};
