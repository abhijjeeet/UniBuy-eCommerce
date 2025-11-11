import { Route, Tags, Get, Post, Patch, Delete, Body, Query, Security } from "tsoa";
import prisma from "../../../prisma/prisma";
import { BaseController, MsgRes } from "../BaseController";
import { OrderItemDTO } from "../../types/cartItem";

const RESOURCE = "OrderItem";

@Route("admin/order-item")
@Tags("OrderItem")
@Security("ADMIN_BEARER_TOKEN")
export class OrderItemControllerAdmin extends BaseController {
  /**
   * Get single or all order items
   */
  @Get("/")
  public async read(
    @Query() id?: string
  ): Promise<OrderItemDTO | OrderItemDTO[] | MsgRes> {
    if (id) {
      const item = await prisma.orderItem.findUnique({
        where: { id },
        include: { order: true, product: true, variant: true },
      });
      if (!item) return this.notFoundRes(RESOURCE, id);
      return this.toOrderItemDTO(item);
    }

    const items = await prisma.orderItem.findMany({
      include: { order: true, product: true, variant: true },
    });
    return items.map((i) => this.toOrderItemDTO(i));
  }

  /**
   * Create order item
   */
  @Post("/")
  public async create(
    @Body()
    data: {
      orderId: string;
      productId: string;
      quantity: number;
      variantId?: string | null;
      sku?: string | null;
      variantSelection?: Record<string, any> | null;
    }
  ): Promise<MsgRes> {
    await prisma.orderItem.create({
      data: {
        orderId: data.orderId,
        productId: data.productId,
        quantity: data.quantity,
        variantId: data.variantId ?? null,
        sku: data.sku ?? null,
        variantSelection: data.variantSelection ?? undefined,
      },
    });
    return this.createRes(RESOURCE);
  }

  /**
   * Update order item
   */
  @Patch("/")
  public async update(
    @Body()
    data: {
      id: string;
      quantity?: number;
      variantId?: string | null;
      sku?: string | null;
      variantSelection?: Record<string, any> | null;
    }
  ): Promise<MsgRes> {
    const { id, ...updateData } = data;

    const payload: any = {
      ...(updateData.quantity !== undefined && { quantity: updateData.quantity }),
      ...(updateData.variantId !== undefined && { variantId: updateData.variantId }),
      ...(updateData.sku !== undefined && { sku: updateData.sku }),
      ...(updateData.variantSelection !== undefined && {
        variantSelection: updateData.variantSelection,
      }),
    };

    await prisma.orderItem.update({
      where: { id },
      data: payload,
    });

    return this.updateRes(RESOURCE);
  }

  /**
   * Delete order item
   */
  @Delete("/")
  public async delete(@Query() id: string): Promise<MsgRes> {
    await prisma.orderItem.delete({ where: { id } });
    return this.deleteRes(RESOURCE);
  }

  /**
   * Convert Prisma entity to DTO
   */
  private toOrderItemDTO(i: any): OrderItemDTO {
    return {
      id: i.id,
      productId: i.productId,
      quantity: i.quantity,
      variantId: i.variantId,
      sku: i.sku,
      variantSelection: i.variantSelection as Record<string, any> | null,
    };
  }
}
