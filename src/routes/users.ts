import express, { Request, Response } from 'express';
import { httpResponse } from '../lib/httpResponse.js';
import { generateToken } from '../lib/generateToken.js';
import User from '../models/user.js';
import { auth, AuthRequest } from "../middleware/auth.js";

const router = express.Router();

// Get all users
router.get('/', auth, async(req: Request & {
    query: {
        page: number | null;
        username: string | null;
        email: string | null;
        ideasFrom: number | null;
        ideasTo: number | null;
    }
}, res: Response) => {
    try {
        let { page = 1, username = null, email = null, ideasFrom = null, ideasTo = null} = req.query;
        
        let query: {
            username?: string;
            email?: string;
            ideas?:{
                $gte?: number;
                $lte?: number;
            }
        } = {};

        if (username) {
            query.username = String(username);
        }

        if (email) {
            query.email = String(email);
        }

        if (ideasFrom || ideasTo) {
            query.ideas = {};
            if(ideasFrom) {
                query.ideas.$gte = Number(ideasFrom);
            }    
            if(ideasTo) {
                query.ideas.$lte = Number(ideasTo);
            }
        }

        const users = await User.find(query).skip(((Number(page) || 1) - 1) * 10).limit(10);

        return httpResponse(200, "User data was fetched successfully", { 
            users: users.map((usersDoc) => {
                return {
                    id: usersDoc._id,
                    username: usersDoc.username,
                    email: usersDoc.email,
                    imageUrl: usersDoc.imageUrl,
                    ideas: usersDoc.ideas
                }
            })
        }, res);
        
    } catch (error) {
        console.error("Error getting users", error);
        return httpResponse(500, "Internal server error", {}, res);
    }
});

// Get user by id
router.get('/:id', auth, async(req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).select('-passwordHash -passwordSalt');

        if(!user) {
            return httpResponse(404, "User not found", {}, res);
        }
        
        return httpResponse(200, "User fetched successfully", { user }, res);
    } catch (error) {
        console.error("Error getting user by id", error);
        return httpResponse(500, "Internal server error", {}, res);
    }
})

// Create or register new user
router.post('/', async(req: Request & {
    body: {
        username: string;
        email: string;
        imageUrl: string;
        ideas: number;
        password: string;
    }
}, res: Response) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return httpResponse(400, "Missing required fields", {}, res);
        }

        if (password.length < 8) {
            return httpResponse(400, "Password must be at least 8 characters long", {}, res);
        }

        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return httpResponse(400, "username is already in use", {}, res);
        }

        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return httpResponse(400, "email is already in use", {}, res);
        }

        const userDoc = new User({
            username,
            email,
            imageUrl: "",
            ideas: 0
        });

        userDoc.setPassword(password);
        await userDoc.save();

        const token = generateToken(String(userDoc._id));

        return httpResponse(200, "User created successfully", {
            token,
            project: {
                id: userDoc._id,
                username: userDoc.username,
                email: userDoc.email,
                imageUrl: userDoc.imageUrl,
                ideas: userDoc.ideas
            }
        }, res);

    } catch (error) {
        console.error("Error in creating user", error);
        return httpResponse(500, "Internal server error", {}, res);
    }
})

// Login user
router.post('/login', async( req: Request & {
    body: {
        email: string;
        password: string;
    }
}
, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return httpResponse(400, "Missing email or password", {}, res);
        }

        const user = await User.findOne({ email });
        if (!user) {
            return httpResponse(400, "Invalid email or passowrd", {}, res);
        }
        
        const validPassword = user.valPassword(password);
        if(!validPassword) {
            return httpResponse(400, "Invalid email or passowrd", {}, res);
        }

        const token = generateToken(user._id as string);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return httpResponse(200, `Login successful, Welcome ${user.username}!`, {
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                imageUrl: user.imageUrl,
            }
        }, res);

    } catch (error) {
        console.error("Error in login user", error);
        return httpResponse(500, "Internal server error", {}, res);
    }
})

// Update user
router.put('/update', auth, async(req: AuthRequest, res: Response) => {
    try {
        const { username, email, imageUrl } = req.body;

        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return httpResponse(400, "username is already in use", {}, res);
        }

        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return httpResponse(400, "email is already in use", {}, res);
        }

        const updateUser = await User.findByIdAndUpdate(
            req.user!.id,
            { username, email, imageUrl },
            { new: true }
        )

        return httpResponse(200, `User updated successfully`, {
            user: {
                id: updateUser?._id,
                username: updateUser?.username,
                email: updateUser?.email,
                imageUrl: updateUser?.imageUrl,
                ideas: updateUser?.ideas
            }
        }, res);

    } catch (error) {
        console.error("Error in updating user", error);
        return httpResponse(500, "Internal server error", {}, res);
    }
})

// Delete user
router.delete('/delete', auth, async(req: AuthRequest, res: Response) => {
    try {
        const user = await User.findByIdAndDelete(req.user!.id);
        if (!user) {
            return httpResponse(400, "User not found", {}, res);
        }

        return httpResponse(200, `User account deleted successfully`, {}, res);
        
    } catch (error) {
        console.error("Error in deleting user", error);
        return httpResponse(500, "Internal server error", {}, res);
    }
})

export default router;