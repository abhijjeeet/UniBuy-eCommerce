import { Route, Tags, Get, Post, Security, Request, Body, Query } from "tsoa";
import prisma from "../../../prisma/prisma";
import { BaseController, MsgRes } from "../BaseController";
import { OrderDTO } from "../../types/cartItem";

const RESOURCE = "Order";

@Route("user/order")
@Tags("Order")
export class OrderControllerUser extends BaseController {
 /**
 * Get all orders for logged-in user (including guest orders with same email)
 */
@Get("/")
@Security("USER_BEARER_TOKEN")
public async getOrders(@Request() req: any): Promise<OrderDTO[]> {
  const userId = req.user.id;

  // Step 1: get user's email
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user?.email) return [];

  // Step 2: fetch all orders for this userId OR same email (covers guest orders)
  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { userId }, // logged-in user's orders
        { user: { email: user.email } }, // guest orders under same email
      ],
    },
    include: {
      items: {
        include: {
          product: { include: { files: true } },
          variant: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Step 3: map to DTO
  return orders.map((o) => ({
    id: o.id,
    userId: o.userId,
    totalPrice: o.totalPrice,
    discount: o.discount,
    finalAmount: o.finalAmount,
    couponCode: o.couponCode,
    status: o.status,
    fullName: o.fullName,
    phone: o.phone,
    address: o.address,
    city: o.city,
    state: o.state,
    postalCode: o.postalCode,
    landmark: o.landmark,
    createdAt: o.createdAt.toISOString(),
    items: o.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      quantity: i.quantity,
      variantId: i.variantId,
      sku: i.sku,
      variantSelection: i.variantSelection as Record<string, any> | null,
    })),
  }));
}

  /**
   * Place new order (COD)
   * Works for both logged-in and guest users
   */
  @Post("/")
  public async placeOrder(
    @Request() req: any,
    @Body()
    body: {
      items: {
        productId: string;
        quantity: number;
        variantId?: string | null;
        sku?: string | null;
        variantSelection?: Record<string, any> | null;
      }[];
      totalPrice: number;
      fullName?: string;
      phone?: string;
      email?: string;
      address?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      landmark?: string;
      couponCode?: string | null;
    }
  ): Promise<OrderDTO | MsgRes> {
    // ✅ Step 1: Identify or create user
    let userId: string | null = req.user?.id || null;

    if (!userId) {
      if (!body.email) throw new Error("Guest checkout requires an email address");

      let user = await prisma.user.findUnique({
        where: { email: body.email.toLowerCase() },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            name: body.fullName || "Guest User",
            email: body.email.toLowerCase(),
            phone: body.phone || null,
            password: "guest",
            role: "USER",
          },
        });
      }

      userId = user.id;
    }

    // ✅ Step 2: Handle coupon and discount
    let discount = 0;
    let finalAmount = body.totalPrice;

    if (body.couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: body.couponCode },
      });

      if (
        coupon &&
        coupon.isActive &&
        (!coupon.expiresAt || coupon.expiresAt > new Date())
      ) {
        discount = (body.totalPrice * coupon.discountPct) / 100;
        finalAmount = body.totalPrice - discount;
      }
    }

    // ✅ Step 3: Create the order with variant support
    const order = await prisma.order.create({
      data: {
        userId,
        totalPrice: body.totalPrice,
        discount,
        finalAmount,
        couponCode: body.couponCode || null,
        status: "PENDING",
        fullName: body.fullName || "",
        phone: body.phone || "",
        address: body.address || "",
        city: body.city || "",
        state: body.state || "",
        postalCode: body.postalCode || "",
        landmark: body.landmark || "",
        items: {
          create: body.items.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            variantId: it.variantId ?? null,
            sku: it.sku ?? null,
            variantSelection: it.variantSelection ?? undefined,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // ✅ Step 4: Clear cart for logged-in users
    if (req.user?.id) {
      await prisma.cartItem.deleteMany({ where: { userId } });
    }

    // ✅ Step 5: Return DTO-safe response
    return {
      id: order.id,
      userId: order.userId,
      totalPrice: order.totalPrice,
      discount: order.discount,
      finalAmount: order.finalAmount,
      couponCode: order.couponCode,
      status: order.status,
      fullName: order.fullName,
      phone: order.phone,
      address: order.address,
      city: order.city,
      state: order.state,
      postalCode: order.postalCode,
      landmark: order.landmark,
      createdAt: order.createdAt.toISOString(),
      items: order.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        quantity: i.quantity,
        variantId: i.variantId,
        sku: i.sku,
        variantSelection: i.variantSelection as Record<string, any> | null,
      })),
    };
  }

  /**
   * Validate coupon
   */
  @Get("/coupon/validate")
  public async validateCoupon(@Query() code: string): Promise<any> {
    const coupon = await prisma.coupon.findUnique({ where: { code } });
    if (!coupon || !coupon.isActive)
      return this.badRequestRes("Invalid coupon");
    if (coupon.expiresAt && coupon.expiresAt < new Date())
      return this.badRequestRes("Coupon expired");
    return coupon;
  }
}
