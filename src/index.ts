import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { connectToDB } from './lib/dbConnection.js';
import projectsRouter from './routes/projects.js';
import usersRouter from './routes/users.js';

async function start() {
    dotenv.config({ 
        path: './.env' 
    });

    const app = express();
    const port = process.env.HTTP_PORT || 3000;

    app.use(express.json());
    app.use(cookieParser());

    app.use('/projects', projectsRouter);
    app.use('/users', usersRouter);

    connectToDB().then(() => {
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    })
}

start();