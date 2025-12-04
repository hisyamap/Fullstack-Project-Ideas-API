import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { httpResponse } from '../lib/httpResponse.ts';

export interface AuthRequest extends Request {
    user?: { id: string };
}

export const auth = async(req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.cookies.token;

    if (!token) {
        return httpResponse(401, "Unauthorized: Missing token", {}, res);
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as {
            id: string;
        };

        req.user = { id: decoded.id };

        if(!decoded?.id) {
            return httpResponse(401, "Unauthorized: Invalid token", {}, res);
        }

        next();

    } catch (error) {
        return httpResponse(401, "Unauthorized: Invalid or expired token", {}, res);
    }
};