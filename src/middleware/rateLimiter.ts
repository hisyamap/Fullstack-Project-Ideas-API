import { NextFunction, Request, Response } from "express";
import { ratelimit } from "../lib/upstash.ts";
import { AuthRequest } from "./auth.ts";

export const rateLimiter = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const identifier = req.user?.id || req.ip || "global";

        const { success } = await ratelimit.limit(identifier);

        if ( !success ) {
            return res.status(429).json({
                message: "Too many requests, please try again later",
            })
        }

        next();
    } catch (error) {
        console.log("Rate limiter error", error);
        next(error);
    }
}