import jwt from "jsonwebtoken";
import { env } from "#config";
import { UnauthorizedError, ForbiddenError } from "#errors";

export class AuthMiddlewareClass {
  _jwtSecret = env.JWT_SECRET;

  /**
   * Universal Role-Based Access Control (RBAC) Middleware Factory
   * @param {string[]} allowedRoles - Array of roles permitted to access the route (e.g., ['customer', 'admin'])
   */
  authorize = (allowedRoles = []) => {
    return (req, res, next) => {
      let token = null;

      // 1. Dynamic cookie discovery based on targeted execution roles
      for (const role of allowedRoles) {
        const expectedCookieName = `${role}_token`;
        if (req.cookies?.[expectedCookieName]) {
          token = req.cookies[expectedCookieName];
          break;
        }
      }

      // 2. Reject early if no explicit role cookie is found
      if (!token) {
        return next(
          new UnauthorizedError({
            message: "Access Denied. No active session token found.",
          }),
        );
      }

      try {
        const decoded = jwt.verify(token, this._jwtSecret);

        // 3. Strict structural role alignment enforcement
        if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
          return next(
            new ForbiddenError({
              message:
                "Forbidden. Your operational identity tier lacks access privileges.",
              errors: [
                `Required role: [${allowedRoles.join(" | ")}], Found: [${decoded.role}]`,
              ],
            }),
          );
        }

        // 4. Thread verified security context down the pipeline execution stack
        req.user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
        };

        next();
      } catch (error) {
        return next(
          new UnauthorizedError({
            message:
              "Session expired or invalid token structure. Please re-authenticate.",
            errors: [error.message],
          }),
        );
      }
    };
  };
}

export const AuthMiddleware = new AuthMiddlewareClass();
