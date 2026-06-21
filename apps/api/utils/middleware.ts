import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

export function auth(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            message: "Token not found"
        });
    }

    const token = authHeader.split(" ")[1] ?? " ";

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET!
        ) as JwtPayload;

        req.userId = decoded.sub as string;

        next();
    } catch {
        return res.status(401).json({
            message: "Invalid token"
        });
    }
}