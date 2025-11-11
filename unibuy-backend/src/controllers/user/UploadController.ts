import { Route, Tags, Post, Security, UploadedFile, FormField } from "tsoa";
import { Express } from "express";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import prisma from "../../../prisma/prisma";
import { BaseController, MsgRes } from "../BaseController";
import crypto from "crypto";

// ----------------------------
// Configure S3 Client (iDrive)
// ----------------------------
const s3 = new S3Client({
  region: process.env.IDRIVE_REGION || "us-west-1",
  endpoint: process.env.IDRIVE_ENDPOINT || "https://s3.us-west-1.idrivee2.com",
  credentials: {
    accessKeyId: process.env.IDRIVE_ACCESS_KEY!,
    secretAccessKey: process.env.IDRIVE_SECRET_KEY!,
  },
});

@Route("uploads")
@Tags("Upload")
export class UploadController extends BaseController {
  @Post("/")
  @Security("USER_BEARER_TOKEN")
  public async create(
    @UploadedFile() file: Express.Multer.File,
    @FormField() type: string
  ): Promise<MsgRes> {
    if (!file) throw new Error("Invalid File");

    const { originalname, mimetype, buffer, size } = file;

    // Generate safe unique filename
    const safeName = originalname.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9.\-_]/g, "");
    const uniqueKey = `${Date.now()}-${crypto.randomUUID()}-${safeName}`;

    // ---------------------------
    // 1️⃣ Upload to iDrive e2
    // ---------------------------
    const Bucket = process.env.IDRIVE_BUCKET!;
    await s3.send(
      new PutObjectCommand({
        Bucket,
        Key: uniqueKey,
        Body: buffer,
        ContentType: mimetype,
        ACL: "public-read", // makes it publicly accessible
      })
    );

    const publicUrl = `${process.env.IDRIVE_ENDPOINT!.replace(
      "https://",
      "https://"
    )}/${Bucket}/${uniqueKey}`;

    // ---------------------------
    // 2️⃣ Store record in database
    // ---------------------------
    const uploaded = await prisma.uploadFile.create({
      data: {
        filename: uniqueKey,
        originalname,
        mimetype,
        size,
        type,
        path: publicUrl,
      },
    });

    return this.msgRes("File uploaded successfully");
  }
}
