import { Route, Tags, Get, Post, Patch, Delete, Body, Query, Security } from "tsoa";
import prisma from "../../../prisma/prisma";
import { BaseController, MsgRes } from "../BaseController";
import { OrderDTO, OrderItemDTO } from "../../types/cartItem";

const RESOURCE = "Order";

@Route("admin/order")
@Tags("Order")
@Security("ADMIN_BEARER_TOKEN")
export class OrderControllerAdmin extends BaseController {


@Get("/")
  public async list(): Promise<OrderDTO[]> {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        // ✅ Fix #1: actual field is discountPct, not discountPercent
        coupon: { select: { code: true, discountPct: true } },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                // ✅ Fix #2: UploadFile model has only `id` and `path` (no `url`)
                files: { select: { id: true, path: true } },
              },
            },
          },
        },
      },
    });

    // ✅ Convert Prisma result → OrderDTO[]
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
      createdAt: o.createdAt.toISOString(), // ✅ Fix #3: Date → string
      // ✅ Fix #4: Explicitly type map param and return
      items: (o.items ?? []).map((it: any): OrderItemDTO => ({
        id: it.id,
        productId: it.productId,
        quantity: it.quantity,
        variantId: it.variantId,
        sku: it.sku,
        variantSelection: it.variantSelection as Record<string, any> | null,
        product: it.product
          ? {
              id: it.product.id,
              name: it.product.name,
              price: it.product.price,
              files: it.product.files,
            }
          : null,
      })),
    }));
  }
  
  /**
   * Create order manually (admin)
   */
  @Post("/")
  public async create(@Body() data: any): Promise<MsgRes> {
    await prisma.order.create({ data });
    return this.createRes(RESOURCE);
  }

@Patch("/")
public async update(
  @Body() data: Partial<OrderDTO> & { id: string }
): Promise<MsgRes> {
  try {
    const { id, ...updateData } = data;
    const sanitizedUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, v]) => v !== null)
    );

    await prisma.order.update({
      where: { id },
      data: sanitizedUpdateData,
    });

    return this.updateRes("Order");
  } catch (error) {
    console.error("Order update error:", error);
    throw new Error(`Failed to update order`);
  }
}

  /**
   * Delete order
   */
  @Delete("/")
  public async delete(@Query() id: string): Promise<MsgRes> {
    await prisma.order.delete({ where: { id } });
    return this.deleteRes(RESOURCE);
  }

  /**
   * Convert Prisma order to plain DTO
   */
  private toOrderDTO(order: any): OrderDTO {
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
      items: order.items.map((i: any) => ({
        id: i.id,
        productId: i.productId,
        quantity: i.quantity,
        variantId: i.variantId,
        sku: i.sku,
        variantSelection: i.variantSelection as Record<string, any> | null,
      })),
    };
  }
}
