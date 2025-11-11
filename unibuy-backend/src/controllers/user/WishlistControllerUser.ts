import { Route, Tags, Get, Post, Delete, Body, Security, Request, Query } from "tsoa";
import prisma from "../../../prisma/prisma";
import { BaseController, MsgRes } from "../BaseController";
import { Wishlist } from "@prisma/client";

const RESOURCE = "Wishlist";

@Route("user/wishlist")
@Tags("Wishlist")
@Security("USER_BEARER_TOKEN")
export class WishlistControllerUser extends BaseController {

  /**
   * Get wishlist
   */
  @Get("/")
  public async getWishlist(@Request() req: any): Promise<Wishlist[]> {
    const userId = req.user.id
    return await prisma.wishlist.findMany({
      where: { userId },
      include: {
        product: {
          include: { files: true }, // ✅ correct Prisma include
        },
      },  
    });

  }

  /**
   * Add to wishlist
   */
  @Post("/")
  public async add(@Request() req: any, @Body() body: { productId: string }): Promise<MsgRes> {
    const userId = req.user.id
    const exists = await prisma.wishlist.findFirst({ where: { userId, productId: body.productId } });
    if (exists) return this.badRequestRes("Already in wishlist");
    await prisma.wishlist.create({ data: { productId: body.productId, userId } });
    return this.createRes(RESOURCE);
  }

  /**
   * Remove from wishlist
   */
  @Delete("/")
  public async remove(@Request() req: any, @Query() id: string): Promise<MsgRes> {
    const userId = req.user.id
    const item = await prisma.wishlist.findFirst({ where: { id, userId } });
    if (!item) return this.notFoundRes(RESOURCE, id);
    await prisma.wishlist.delete({ where: { id } });
    return this.deleteRes(RESOURCE);
  }
}
