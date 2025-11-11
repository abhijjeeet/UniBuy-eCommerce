import * as express from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { jwtConfig } from "../config/jwt.config";
import prisma from "../prisma/prisma";
import logger from "../src/utils/logger";

interface DecodedToken {
  id: string;
  email?: string;
  role?: string;
}

export async function expressAuthentication(
  request: express.Request,
  securityName: string
): Promise<any> {
  const { authorization } = request.headers;

  if (!authorization) {
    throw new Error("Missing Authorization Header");
  }

  const token = authorization.split(" ")[1];
  if (!token) {
    throw new Error("Invalid Bearer Token");
  }

  let decoded: DecodedToken | JwtPayload;
  try {
    decoded = jwt.verify(token, jwtConfig.secret) as DecodedToken | JwtPayload;
  } catch (error) {
    logger.error(error);
    throw new Error("Invalid JWT Token");
  }

  if (typeof decoded !== "object" || !("id" in decoded)) {
    throw new Error("Malformed Token");
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.id as string } });
  if (!user) throw new Error("Invalid User Token");

  // 🔒 Admin Authentication
  if (securityName === "ADMIN_BEARER_TOKEN") {
    if (user.role !== "ADMIN") {
      throw new Error("Access denied. Admin privileges required.");
    }
    return { ...user, role: "ADMIN" };
  }

  // 👤 User Authentication
  if (securityName === "USER_BEARER_TOKEN") {
    if (user.role !== "USER" && user.role !== "ADMIN") {
      throw new Error("Access denied. Invalid role for user route.");
    }
    return { ...user, role: "USER" };
  }

  throw new Error("Unsupported Security Scheme");
}
