import { Request, Response } from 'express';
import { httpResponse } from '../lib/httpResponse.js';
import User from '../models/user.js';
import Project from '../models/project.js';
import { AuthRequest } from "../middleware/auth.js";

export async function getAllProjects(
    req:Request, res: Response
) {
    try {
        const page = Number(req.query.page) || 1;
        const projects = await Project.find().sort({ createdAt : -1 }).skip((page - 1) * 10).limit(10); // newest first and 10 each page

        return httpResponse(200, "Project ideas retrieved successfully", { projects }, res);

    } catch (error) {
        console.error("Error getting projects", error);
        return httpResponse(500, "Internal server error", {}, res);
    }
}

export async function getIdProject(
    req: Request, res: Response
) {
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
}

export async function createProject(
    req: Request, res: Response
) {
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
                return !item.frontend || !item.backend;
            })

            if (invalidItem) {
                return httpResponse(400, "Each stack item must atleast include frontend and backend", {}, res);
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
                likes: projectDoc.likes,
                user: projectDoc.user,
                stack: projectDoc.stack
            }
        }, res);

    } catch (error) {
        console.error("Error in creating project", error);
        return httpResponse(500, "Internal server error", {}, res);
    }
}

export async function updateProject(
    req: AuthRequest, res: Response
) {
    try {
        const { id } = req.params;
        const { name, description, difficulty, stack } = req.body;

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
        
        if (stack !== undefined) {
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

        const updateProject = await Project.findByIdAndUpdate(
            id,
            { $set: project },
            { new: true }
        )

        return httpResponse(200, "Project idea updated successfully", {
            project: {
                id: updateProject!._id,
                name: updateProject!.name,
                description: updateProject!.description,
                difficulty: updateProject!.difficulty,
                likes: updateProject!.likes,
                user: updateProject!.user,
                stack: updateProject!.stack
            }
        }, res) 

    } catch (error) {
        console.error("Error in updating project", error);
        return httpResponse(500, "Internal server error", {}, res);
    }
}

export async function deleteProject(
    req: AuthRequest, res: Response
) {
    try {
        const { id } = req.params;

        const project = await Project.findById(id);
        if (!project) {
            return httpResponse(400, "Project idea not found", {}, res);
        }
        
        if (project.user.toString() !== req.user!.id) {
            return httpResponse(403, "Forbidden: You do not own this project idea", {}, res);
        }

        await Project.findByIdAndDelete(id);
    
        return httpResponse(200, "Project idea deleted successfully", {}, res);

    } catch (error) {
        console.error("Error in deleting project", error);
        return httpResponse(500, "Internal server error", {}, res);
    }
}