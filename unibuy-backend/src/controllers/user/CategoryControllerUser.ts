import { Route, Tags, Get, Query } from "tsoa";
import prisma from "../../../prisma/prisma";
import { BaseController } from "../BaseController";
import { Product, Category, Tag } from "@prisma/client";



@Route("user/category")
@Tags("Category")
export class CategoryControllerUser extends BaseController {
  @Get("/")
  public async list(): Promise<Category[]> {
    return await prisma.category.findMany({ include: { products: true } });
  }

    
}
