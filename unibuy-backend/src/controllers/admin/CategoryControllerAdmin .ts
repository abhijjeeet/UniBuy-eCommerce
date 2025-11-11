import { Route, Tags, Get, Post, Patch, Delete, Body, Query, Security } from "tsoa";
import prisma from "../../../prisma/prisma";
import { BaseController, MsgRes } from "../BaseController";
import { Category } from "@prisma/client";

const RESOURCE = "Category";

@Route("admin/category")
@Tags("Category")
@Security("ADMIN_BEARER_TOKEN")
export class CategoryControllerAdmin extends BaseController {

  @Get("/")
  public async read(@Query() id?: string): Promise<Category | Category[] | MsgRes> {
    if (id) {
      const category = await prisma.category.findUnique({ where: { id }, include: { products: true } });
      if (!category) return this.notFoundRes(RESOURCE, id);
      return category;
    }
    return await prisma.category.findMany({ include: { products: true } });
  }

  @Post("/")
  public async create(@Body() data: Omit<Category, "id">): Promise<MsgRes> {
    await prisma.category.create({ data });
    return this.createRes(RESOURCE);
  }

  @Patch("/")
  public async update(@Body() data: Partial<Category> & { id: string }): Promise<MsgRes> {
    await prisma.category.update({ where: { id: data.id }, data });
    return this.updateRes(RESOURCE);
  }

  @Delete("/")
  public async delete(@Query() id: string): Promise<MsgRes> {
    await prisma.category.delete({ where: { id } });
    return this.deleteRes(RESOURCE);
  }
}
