"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAuth = withAuth;
const server_1 = require("next/server");
const auth_1 = require("./auth");
function withAuth(handler, requiredRole) {
    return async function (req) {
        const token = req.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return server_1.NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        const user = (0, auth_1.verifyToken)(token);
        if (!user) {
            return server_1.NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
        }
        if (requiredRole && user.role !== requiredRole) {
            return server_1.NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }
        // Pass the user to the handler function instead of modifying the request
        return handler(req, user);
    };
}
