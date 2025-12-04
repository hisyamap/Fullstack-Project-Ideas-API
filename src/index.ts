import express from 'express';
import dotenv from 'dotenv';
import { connectToDatabase } from './lib/dbConnection.js';
import projectsRouter from './routes/projects.js';
import usersRouter from './routes/users.js';
import cookieParser from 'cookie-parser';

async function start() {
    dotenv.config({ 
        path: './.env' 
    });

    await connectToDatabase();

    const app = express();

    app.use(express.json());
    app.use(cookieParser());

    app.use('/projects', projectsRouter);
    app.use('/users', usersRouter);

    const port = process.env.HTTP_PORT || 3000;

    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

start();