import {
  Route,
  Tags,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Security,
  Request,
  Query,
} from "tsoa";
import prisma from "../../../prisma/prisma";
import { BaseController, MsgRes } from "../BaseController";
import { CartItemDTO } from "../../types/cartItem";

const RESOURCE = "CartItem";

// 👇 Define a lightweight DTO (no Prisma types)
// export interface CartItemDTO {
//   id: string;
//   userId: string;
//   productId: string;
//   quantity: number;
//   sku?: string | null;
//   variantId?: string | null;
//   variantSelection?: Record<string, any> | null;
//   product?: any; // included product info
// }

@Route("user/cart")
@Tags("Cart")
@Security("USER_BEARER_TOKEN")
export class CartItemControllerUser extends BaseController {
  /**
   * Get user's cart
   */
  @Get("/")
  public async getCart(@Request() req: any): Promise<CartItemDTO[]> {
    const userId = req.user.id;

    const items = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            files: true,
          },
        },
        variant: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    // 🧹 Map Prisma models → DTO (to prevent tsoa type resolution)
    return items.map((i) => ({
      id: i.id,
      userId: i.userId,
      userName: i.user?.name ?? "",
      productId: i.productId,
      productName: i.product?.name ?? "",
      quantity: i.quantity,
      sku: i.sku,
      variantId: i.variantId,
      variant: i.variant,
      variantSelection: i.variantSelection as Record<string, any> | null,
      product: i.product,
    }));
  }

  /**
   * Add product to cart
   */
  @Post("/")
  public async addToCart(
    @Request() req: any,
    @Body()
    body: {
      productId: string;
      quantity: number;
      variantId?: string | null;
      variantSelection?: Record<string, any> | null;
      sku?: string | null;
    }
  ): Promise<MsgRes> {
    const userId = req.user.id;

    const existing = await prisma.cartItem.findFirst({
      where: {
        userId,
        productId: body.productId,
        variantId: body.variantId ?? null,
      },
    });

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + body.quantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          userId,
          productId: body.productId,
          variantId: body.variantId ?? null,
          variantSelection: body.variantSelection ?? undefined,
          sku: body.sku ?? undefined,
          quantity: body.quantity,
        },
      });
    }

    return this.createRes(RESOURCE);
  }

  /**
   * Update quantity
   */
  @Patch("/")
  public async updateQuantity(
    @Request() req: any,
    @Body() body: { id: string; quantity: number }
  ): Promise<MsgRes> {
    const userId = req.user.id;
    const item = await prisma.cartItem.findFirst({ where: { id: body.id, userId } });
    if (!item) return this.notFoundRes(RESOURCE, body.id);
    await prisma.cartItem.update({
      where: { id: body.id },
      data: { quantity: body.quantity },
    });
    return this.updateRes(RESOURCE);
  }

  /**
   * Remove from cart
   */
  @Delete("/")
  public async remove(
    @Request() req: any,
    @Query() id: string
  ): Promise<MsgRes> {
    const userId = req.user.id;
    const item = await prisma.cartItem.findFirst({ where: { id, userId } });
    if (!item) return this.notFoundRes(RESOURCE, id);
    await prisma.cartItem.delete({ where: { id } });
    return this.deleteRes(RESOURCE);
  }
}
