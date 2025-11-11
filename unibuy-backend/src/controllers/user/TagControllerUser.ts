
import { Route, Tags, Get, Query } from "tsoa";
import prisma from "../../../prisma/prisma";
import { BaseController } from "../BaseController";
import { Product, Category, Tag } from "@prisma/client";




@Route("user/tag")
@Tags("Tag")
export class TagControllerUser extends BaseController {
  @Get("/")
  public async list(): Promise<Tag[]> {
    return await prisma.tag.findMany({ include: { products: true } });
  }

  
}
