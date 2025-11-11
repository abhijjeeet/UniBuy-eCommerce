import { Route, Tags, Get, Patch, Body, Security, Request, Query } from "tsoa";
import prisma from "../../../prisma/prisma";
import { BaseController, MsgRes } from "../BaseController";
import { User } from "@prisma/client";

const RESOURCE = "User";

@Route("user")
@Tags("User")
@Security("USER_BEARER_TOKEN")
export class UserController extends BaseController {
  /**
   * Get Logged-in User Profile
   */
  @Get("/profile")
  public async profile(@Request() req: any): Promise<User | MsgRes> {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { cartItems: true } });
    if (!user) return this.notFoundRes(RESOURCE, userId);
    return user;
  }




  /**
   * Update Logged-in User Profile
   */
  @Patch("/profile")
  public async updateProfile(
    @Request() req: any,
    @Body() data: Partial<User>
  ): Promise<MsgRes> {
    const userId = req.user.id;
    await prisma.user.update({ where: { id: userId }, data });
    return this.updateRes(RESOURCE);
  }

  protected getUserId(request: any): string {
    return (request as any).user?.id;
  }
}
