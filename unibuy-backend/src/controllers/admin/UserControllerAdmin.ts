import { Route, Tags, Get, Post, Patch, Delete, Body, Query, Security } from "tsoa";
import prisma from "../../../prisma/prisma";
import { BaseController, MsgRes } from "../BaseController";
import { User } from "@prisma/client";

const RESOURCE = "User";

@Route("admin/user")
@Tags("User")
@Security("ADMIN_BEARER_TOKEN")
export class UserControllerAdmin extends BaseController {

  /**
   * Read User(s)
   */
  @Get("/")
  public async read(@Query() id?: string): Promise<User | User[] | MsgRes> {
    if (id) {
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) return this.notFoundRes(RESOURCE, id);
      return user;
    }
    return await prisma.user.findMany();
  }

  /**
   * Create User
   */
  @Post("/")
  public async create(@Body() data: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<MsgRes> {
    await prisma.user.create({ data });
    return this.createRes(RESOURCE);
  }

  /**
   * Update User
   */
  @Patch("/")
  public async update(@Body() data: Partial<User> & { id: string }): Promise<MsgRes> {
    await prisma.user.update({ where: { id: data.id }, data });
    return this.updateRes(RESOURCE);
  }

  /**
   * Delete User
   */
  @Delete("/")
  public async delete(@Query() id: string): Promise<MsgRes> {
    await prisma.user.delete({ where: { id } });
    return this.deleteRes(RESOURCE);
  }
}
