import jwt from "jsonwebtoken";

import { env } from "#config";

export class AuthMiddlewareClass {
  _jwtSecret = env.JWT_SECRET;

  authenticateSeller = (req, res, next) => {
    const token = req.cookies?.seller_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access Denied. No session token provided.",
      });
    }

    try {
      const decoded = jwt.verify(token, this._jwtSecret);

      // Strict role enforcement matching your schema configurations
      if (decoded.role !== "seller") {
        return res.status(403).json({
          success: false,
          message: "Forbidden. Access restricted to merchant entities.",
        });
      }

      // Attach context downstream
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message:
          "Session expired or invalid token structure. Please re-authenticate.",
      });
    }
  };
}

export const AuthMiddleware = new AuthMiddlewareClass();
