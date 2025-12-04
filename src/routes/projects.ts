import express, { Request, Response } from 'express';
import { httpResponse } from '../lib/httpResponse.js';
import User from '../models/user.js';
import Project from '../models/project.js';
import { auth, AuthRequest } from "../middleware/auth.js";

const router = express.Router();

//Get project idea by query
router.get('/', async(req:Request & {
    query: {
        page: number | null;
        user: string | null;
        difficulty: string | null;
        dateFrom: Date | null;
        dateTo: Date | null;
        likesFrom: number | null;
        likesTo: number | null;
    }
}, res: Response) => {
    try {
        let { page = 1, user = null, difficulty = null, likesFrom = null, likesTo = null, dateFrom = null, dateTo = null } = req.query;

        let query: {
            user?: string;
            difficulty?: string;
            likes?:{
                $gte?: number;
                $lte?: number;
            }
            date?:{
                $gte?: Date;
                $lte?: Date;
            }
        } = {};

        if (user) {
            query.user = String(user);
        }

        if (difficulty) {
            query.difficulty = String(difficulty);
        }
        
        if (likesFrom || likesTo) {
            query.likes = {};
            if(likesFrom) {
                query.likes.$gte = Number(likesFrom);
            }    
            if(likesTo) {
                query.likes.$lte = Number(likesTo);
            }
        }

        if(dateFrom || dateTo) {
            query.date = {};
            if(dateFrom){
                query.date.$gte = dateFrom;
            }
            if(dateTo){
                query.date.$lte = dateTo;
            }
        }
        
        const projects = await Project.find(query).sort({ date : -1 }).skip(((Number(page) || 1) - 1) * 10).limit(10);

        return httpResponse(200, "Project ideas retrieved successfully", {
            projects: projects.map((projectDoc) => {
                return {
                    id: projectDoc._id,
                    name: projectDoc.name,
                    description: projectDoc.description,
                    difficulty: projectDoc.difficulty,
                    date: projectDoc.date,
                    likes: projectDoc.likes,
                    user: projectDoc.user,
                    stack: projectDoc.stack
                }
            })
        }, res);

    } catch (error) {
        console.error("Error getting projects", error);
        return httpResponse(500, "Internal server error", {}, res);
    }
})

// Get project ideas by id
router.get('/:id', async(req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const project = await Project.findById(id)

        if(!project) {
            return httpResponse(404, "Project idea not found", {}, res);
        }
        
        return httpResponse(200, "Project idea fetched successfully", { project }, res);
    } catch (error) {
        console.error("Error getting project by id", error);
        return httpResponse(500, "Internal server error", {}, res);
    }
})

// Create new project idea
router.post('/', auth, async(req: Request & {
    body: {
        name: string;
        description: string;
        difficulty: "easy" | "medium" | "hard";
        date: Date;
        likes: number;
        user: string;
        stack: { 
            frontend: string; 
            backend: string; 
            api: string; 
        }[]
    }
}, res: Response) => {
    try {
        const { name, description, difficulty, user, stack } = req.body;

        if (!name || !description || !difficulty || !user || !stack) {
            return httpResponse(400, "Missing required fields", {}, res);
        }

        if (!["easy", "medium", "hard"].includes(difficulty)) {
            return httpResponse(400, "Difficulty must be easy, medium, or hard", {}, res);
        }

        if (!Array.isArray(stack)) {
            return httpResponse(400, "The stack must be in an array format", {}, res);
        }

        if (stack.length > 0) {
            const invalidItem = stack.find((item) => {
                return !item.frontend || !item.backend || !item.api;
            })

            if (invalidItem) {
                return httpResponse(400, "Each stack item must include frontend, backend, api", {}, res);
            }
        }

        const userDoc = await User.findById(user);

        if (!userDoc) {
            return httpResponse(400, "User not found", {}, res);
        }

        const projectDoc = new Project({
            name,
            description,
            difficulty,
            user,
            stack
        });

        await projectDoc.save();

        userDoc.ideas += 1;
        await userDoc.save();

        return httpResponse(201, "Project idea created successfully", {
            project: {
                id: projectDoc._id,
                name: projectDoc.name,
                description: projectDoc.description,
                difficulty: projectDoc.difficulty,
                date: projectDoc.date,
                likes: projectDoc.likes,
                user: projectDoc.user,
                stack: projectDoc.stack
            }
        }, res);

    } catch (error) {
        console.error("Error in creating project", error);
        return httpResponse(500, "Internal server error", {}, res);
    }
})

// Update project idea
router.put('/:id', auth, async(req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description, difficulty, user, stack } = req.body;

        const project = await Project.findById(id);
        if (!project) {
            return httpResponse(400, "Project idea not found", {}, res);
        }

        if (project.user.toString() !== req.user!.id) {
            return httpResponse(403, "Forbidden: You do not own this project idea", {}, res);
        }

        if (name) {
            project.name = name;
        }
        if (description) {
            project.description = description;
        }
        if (difficulty) {
            if (!["easy", "medium", "hard"].includes(difficulty)) {
                return httpResponse(400, "Difficulty must be easy, medium, or hard", {}, res);
            }
            project.difficulty = difficulty;
        }
        if (user) {
            project.user = user;
        }
        if (stack) {
            if (!Array.isArray(stack)) {
                return httpResponse(400, "The stack must be in an array format", {}, res);
            }

            if (stack.length > 0) {
                const invalidItem = stack.find((item) => {
                    return !item.frontend || !item.backend || !item.api;
                })

                if (invalidItem) {
                    return httpResponse(400, "Each stack item must include frontend, backend, api", {}, res);
                }
            }

            project.stack = stack;
        }

        await project.save();

        return httpResponse(200, "Project idea updated successfully", {
            project: {
                id: project._id,
                name: project.name,
                description: project.description,
                difficulty: project.difficulty,
                date: project.date,
                likes: project.likes,
                user: project.user,
                stack: project.stack
            }
        }, res) 

    } catch (error) {
        console.error("Error in updating project", error);
        return httpResponse(500, "Internal server error", {}, res);
    }
})

router.delete("/:id", auth, async(req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const project = await Project.findByIdAndDelete(id);
        if ( !project ) {
            return httpResponse(400, "Project idea not found", {}, res);
        }
        
        if (project.user.toString() !== req.user!.id) {
            return httpResponse(403, "Forbidden: You do not own this project idea", {}, res);
        }
    
        return httpResponse(200, "Project idea deleted successfully", {}, res);

    } catch (error) {
        console.error("Error in deleting project", error);
        return httpResponse(500, "Internal server error", {}, res);
    }
})

export default router;