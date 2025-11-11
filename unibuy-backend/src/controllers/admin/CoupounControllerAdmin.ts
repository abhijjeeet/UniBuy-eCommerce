import {
  Route,
  Tags,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Query,
  Security,
} from "tsoa";
import prisma from "../../../prisma/prisma";
import { BaseController, MsgRes } from "../BaseController";
import { Coupon } from "@prisma/client";

const RESOURCE = "Coupon";

@Route("admin/coupons")
@Tags("Coupon")
@Security("ADMIN_BEARER_TOKEN")
export class CouponControllerAdmin extends BaseController {
  /** 🧾 Get all or single coupon */
  @Get("/")
  public async read(@Query() id?: string): Promise<Coupon | Coupon[] | MsgRes> {
    if (id) {
      const coupon = await prisma.coupon.findUnique({ where: { id } });
      if (!coupon) return this.notFoundRes(RESOURCE, id);
      return coupon;
    }
    return await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  }

  /** ➕ Create coupon */
  @Post("/")
  public async create(
    @Body()
    body: {
      code: string;
      discountPct: number;
      expiresAt?: string | null;
      isActive?: boolean;
      usageLimit?: number;
    }
  ): Promise<MsgRes> {
    if (!body.code || !body.discountPct)
      return this.badRequestRes("Code and discount percentage required.");

    const exists = await prisma.coupon.findUnique({
      where: { code: body.code.toUpperCase() },
    });
    if (exists) return this.badRequestRes("Coupon code already exists.");

    await prisma.coupon.create({
      data: {
        code: body.code.toUpperCase(),
        discountPct: Number(body.discountPct),
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        isActive: body.isActive ?? true,
        usageLimit: body.usageLimit ?? 1, // default single-use
      },
    });

    return this.createRes(RESOURCE);
  }

  /** ✏️ Update coupon */
  @Patch("/")
  public async update(
    @Body() data: Partial<Coupon> & { id: string }
  ): Promise<MsgRes> {
    const coupon = await prisma.coupon.findUnique({ where: { id: data.id } });
    if (!coupon) return this.notFoundRes(RESOURCE, data.id);

    await prisma.coupon.update({
      where: { id: data.id },
      data: {
        code: data.code?.toUpperCase() ?? coupon.code,
        discountPct: data.discountPct ?? coupon.discountPct,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : coupon.expiresAt,
        isActive: data.isActive ?? coupon.isActive,
        usageLimit: data.usageLimit ?? coupon.usageLimit,
      },
    });

    return this.updateRes(RESOURCE);
  }

  /** 🗑 Delete coupon */
  @Delete("/")
  public async delete(@Query() id: string): Promise<MsgRes> {
    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) return this.notFoundRes(RESOURCE, id);
    await prisma.coupon.delete({ where: { id } });
    return this.deleteRes(RESOURCE);
  }
}
