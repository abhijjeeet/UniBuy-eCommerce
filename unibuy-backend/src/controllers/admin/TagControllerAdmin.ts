import { Route, Tags, Get, Post, Patch, Delete, Body, Query, Security } from "tsoa";
import prisma from "../../../prisma/prisma";
import { BaseController, MsgRes } from "../BaseController";
import { Tag } from "@prisma/client";

const RESOURCE = "Tag";

@Route("admin/tag")
@Tags("Tag")
@Security("ADMIN_BEARER_TOKEN")
export class TagControllerAdmin extends BaseController {

  @Get("/")
  public async read(@Query() id?: string): Promise<Tag | Tag[] | MsgRes> {
    if (id) {
      const tag = await prisma.tag.findUnique({ where: { id }, include: { products: true } });
      if (!tag) return this.notFoundRes(RESOURCE, id);
      return tag;
    }
    return await prisma.tag.findMany({ include: { products: true } });
  }

  @Post("/")
  public async create(@Body() data: Omit<Tag, "id">): Promise<MsgRes> {
    await prisma.tag.create({ data });
    return this.createRes(RESOURCE);
  }

  @Patch("/")
  public async update(@Body() data: Partial<Tag> & { id: string }): Promise<MsgRes> {
    await prisma.tag.update({ where: { id: data.id }, data });
    return this.updateRes(RESOURCE);
  }

  @Delete("/")
  public async delete(@Query() id: string): Promise<MsgRes> {
    await prisma.tag.delete({ where: { id } });
    return this.deleteRes(RESOURCE);
  }
}
