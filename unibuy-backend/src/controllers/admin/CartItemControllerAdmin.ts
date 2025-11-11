// CartItemControllerAdmin.ts (Your provided code, simplified for clarity)

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
import { CartItemDTO, toCartItemDTO } from "../../types/cartItem"; // Assuming this path is correct

const RESOURCE = "CartItem";

@Route("admin/cart-item")
@Tags("CartItem")
@Security("ADMIN_BEARER_TOKEN")
export class CartItemControllerAdmin extends BaseController {
  /** READ ALL / SINGLE */
  @Get("/")
  public async read(
    @Query() id?: string
  ): Promise<CartItemDTO | CartItemDTO[] | MsgRes> {
    // ... (rest of read function is fine, uses toCartItemDTO) ...
    if (id) {
      const item = await prisma.cartItem.findUnique({
        where: { id },
        include: { user: true, product: true, variant: true },
      });
      if (!item) return this.notFoundRes(RESOURCE, id);
      return toCartItemDTO(item);
    }

    const items = await prisma.cartItem.findMany({
      include: { user: true, product: true, variant: true },
    });
    return items.map(toCartItemDTO);
  }

  /** CREATE */
  @Post("/")
  public async create(
    @Body()
    body: {
      userId: string;
      productId: string;
      quantity: number;
      sku?: string | null;
      variantId?: string | null;
      // ✅ TSOA-friendly type for the JSON field
      variantSelection?: Record<string, any> | null; 
    }
  ): Promise<MsgRes> {
    // ... (rest of create function is fine) ...
    await prisma.cartItem.create({
      data: {
        userId: body.userId,
        productId: body.productId,
        quantity: body.quantity,
        sku: body.sku ?? undefined,
        variantId: body.variantId ?? null,
        variantSelection: body.variantSelection ?? undefined,
      },
    });

    return this.createRes(RESOURCE);
  }

  /** UPDATE */
  @Patch("/")
  public async update(
    @Body()
    body: {
      id: string;
      quantity?: number;
      sku?: string | null;
      variantId?: string | null;
      // ✅ TSOA-friendly type for the JSON field
      variantSelection?: Record<string, any> | null;
    }
  ): Promise<MsgRes> {
    // ... (rest of update function is fine) ...
    await prisma.cartItem.update({
      where: { id: body.id },
      data: {
        quantity: body.quantity,
        sku: body.sku ?? undefined,
        variantId: body.variantId ?? null,
        variantSelection: body.variantSelection ?? undefined,
      },
    });

    return this.updateRes(RESOURCE);
  }

  /** DELETE */
  @Delete("/")
  public async delete(@Query() id: string): Promise<MsgRes> {
    await prisma.cartItem.delete({ where: { id } });
    return this.deleteRes(RESOURCE);
  }
}