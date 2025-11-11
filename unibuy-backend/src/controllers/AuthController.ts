import { Route, Tags, Post, Body } from "tsoa";
import prisma from "../../prisma/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { jwtConfig } from "../../config/jwt.config";
import { BaseController, MsgRes } from "./BaseController";
import { Role } from "@prisma/client";
import { appConfig } from "../../config/app.config";
import { sendOtpEmail } from "../utils/sendOtp";

interface LoginBody {
  email: string;
  password: string;
}

interface TokenRes {
  token: string;
  role: Role;
}

const RESOURCE = "User";

@Route("auth")
@Tags("Auth")
export class AuthController extends BaseController {
  /**
   * Login User
   */
  @Post("/login")
  public async login(@Body() body: LoginBody): Promise<TokenRes | MsgRes> {
    const { email, password } = body;

    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) return this.notFoundRes(RESOURCE, email);

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return this.badRequestRes("Invalid credentials");

    if (!user.isVerified)
      return this.badRequestRes("Please verify your email before login");

    const { secret } = jwtConfig;
    const payload = { id: user.id, email: user.email, role: user.role };
    const token = jwt.sign(payload, secret, { expiresIn: "7d" });

    return { token, role: user.role };
  }

  /**
   * Register new user (requires verified email)
   */
  @Post("/register")
  public async register(
    @Body() body: { name: string; email: string; password: string }
  ): Promise<MsgRes> {
    const { name, email, password } = body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing)
      return this.badRequestRes("Please verify your email before registering.");

    if (!existing.isVerified)
      return this.badRequestRes("Email not verified. Verify OTP first.");

    const hashed = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { email },
      data: {
        name,
        password: hashed,
        role: "USER",
      },
    });

    return this.msgRes("Registration successful! You can now log in.");
  }

  /**
   * Send OTP to user's email
   */
  @Post("/send-otp")
  public async sendOtp(@Body() body: { email: string }): Promise<MsgRes> {
    const { email } = body;
    if (!email) return this.badRequestRes("Email is required");

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // create a temporary user record for OTP
      user = await prisma.user.create({
        data: {
          email,
          name: "Temp User",
          password: await bcrypt.hash("temp", 10),
          role: "USER",
          isVerified: false,
        },
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: { otpCode: otp, otpExpiry: expiry },
    });


    await sendOtpEmail(email, otp);


    return { message: "OTP sent successfully to your email." };
  }

  /**
   * Verify OTP and mark user as verified
   */
  @Post("/verify-otp")
  public async verifyOtp(
    @Body() body: { email: string; otp: string }
  ): Promise<MsgRes> {
    const { email, otp } = body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return this.notFoundRes(RESOURCE, email);
    if (!user.otpCode || !user.otpExpiry)
      return this.badRequestRes("No OTP found. Please request a new one.");

    if (new Date() > new Date(user.otpExpiry))
      return this.badRequestRes("OTP expired. Please request a new one.");

    if (user.otpCode !== otp)
      return this.badRequestRes("Invalid OTP. Please check again.");

    await prisma.user.update({
      where: { email },
      data: { isVerified: true, otpCode: null, otpExpiry: null },
    });

    return { message: "✅ Email verified successfully!" };
  }

/**
 * Reset password after verifying OTP 
 */
  @Post("/reset-password")
  public async resetPassword(
    @Body() body: { email: string; newPassword: string }
  ): Promise<MsgRes> {
    const { email, newPassword } = body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return this.notFoundRes("User", email);
    if (!user.isVerified)
      return this.badRequestRes("Please verify your email before resetting password.");

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { email },
      data: { password: hashed },
    });

    return { message: "Password reset successfully! You can now log in." };
  }

}

// import { Route, Tags, Post, Body } from "tsoa";
// import prisma from "../../prisma/prisma";
// import bcrypt from "bcrypt";
// import jwt from "jsonwebtoken";
// import { jwtConfig } from "../../config/jwt.config";
// import { BaseController, MsgRes } from "./BaseController";
// import { User, Role } from "@prisma/client";

// interface LoginBody {
//   email: string;
//   password: string;
// }

// interface TokenRes {
//   token: string;
//   role: Role;
// }

// const RESOURCE = "User";

// @Route("auth")
// @Tags("Auth")
// export class AuthController extends BaseController {
//   /**
//    * Login User
//    */
//   @Post("/login")
//   public async login(@Body() body: LoginBody): Promise<TokenRes | MsgRes> {
//     const { email, password } = body;

//     const user = await prisma.user.findFirst({ where: { email } });
//     if (!user) return this.notFoundRes(RESOURCE, email);

//     const isPasswordValid = await bcrypt.compare(password, user.password);
//     if (!isPasswordValid) return this.badRequestRes("Invalid credentials");

//     // if (!user.isVerified)
//     //   return this.badRequestRes("Please verify your email before login");

//     const { secret } = jwtConfig;
//     const { id, role } = user;
//     const payload = { id, email, role };
//     const token = jwt.sign(payload, secret, { expiresIn: "7d" });

//     return { token, role };
//   }

//   /**
//    * Register new user (optional if needed)
//    */
//   @Post("/register")
//   public async register(@Body() body: { name: string; email: string; password: string }): Promise<MsgRes> {
//     const { name, email, password } = body;

//     const existing = await prisma.user.findFirst({ where: { email } });
//     if (existing) return this.badRequestRes("User already exists");

//     const hashed = await bcrypt.hash(password, 10);
//     await prisma.user.create({
//       data: { name, email, password: hashed, role: "USER", isVerified: false },
//     });

//     // TODO: send verification email (SMTP/Resend)
//     return this.createRes(RESOURCE);
//   }
// }
