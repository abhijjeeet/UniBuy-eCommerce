import { Route, Tags, Get, Post, Patch, Delete, Body, Query, Security } from "tsoa";
import prisma from "../../../prisma/prisma";
import { BaseController, MsgRes } from "../BaseController";
import { VariantReadDTO } from "product";

const RESOURCE = "Product";

/** ----- DTOs TSOA will validate against ----- */

interface VariantRowInput {
  // detailed row format (Format B)
  optionType?: string;      // e.g. "Color" | "Storage"
  optionValue?: string;     // e.g. "Black" | "128GB"
  price?: number | null;
  stock?: number | null;
  sku?: string | null;
  imageUrl?: string | null;

  // simple format (Format A)
  name?: string;            // e.g. "Color"
  options?: string;         // e.g. "Red, Blue"
}

interface ProductInput {
  id?: string;
  name: string;
  description: string;

  shortDescription?: string;

  price: number;
  stock: number;
  imageUrl?: string;

  categoryIds?: string[];
  tagIds?: string[];
  fileIds?: string[];

  // variants can be either Format A or Format B (mixed allowed)
  variants?: VariantRowInput[] | null;
}

// Minimal DTO for reads (kept simple, add more if you need)
interface ProductReadDTO {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  stock: number;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  categories: { id: string; name: string }[];
  tags: { id: string; name: string }[];
  files: { id: string; path: string }[];
  // You can join variants if you want to return them (omitted for brevity)
}

/** ----- Helpers ----- */

// Normalize variants supporting two formats:
// A) { name: "Color", options: "Red, Blue" }
// B) { optionType: "Color", optionValue: "Red", price?, stock?, sku?, imageUrl? }
function normalizeVariants(input?: VariantRowInput[] | null): {
  optionType: string | null;
  optionValue: string | null;
  price: number | null;
  stock: number | null;
  sku: string | null;
  imageUrl: string | null;
}[] {
  if (!input || !Array.isArray(input)) return [];

  const out: {
    optionType: string | null;
    optionValue: string | null;
    price: number | null;
    stock: number | null;
    sku: string | null;
    imageUrl: string | null;
  }[] = [];

  for (const v of input) {
    const hasSimple = typeof v.name === "string" && typeof v.options === "string";
    const hasDetailed = typeof v.optionType === "string" && typeof v.optionValue === "string";

    if (hasSimple) {
      const optionType = (v.name || "").trim();
      const values = (v.options || "")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);
      for (const optionValue of values) {
        out.push({
          optionType: optionType || null,
          optionValue: optionValue || null,
          price: null,
          stock: null,
          sku: null,
          imageUrl: null,
        });
      }
      continue;
    }

    if (hasDetailed) {
      out.push({
        optionType: v.optionType!.trim() || null,
        optionValue: v.optionValue!.trim() || null,
        price: typeof v.price === "number" ? v.price : null,
        stock: typeof v.stock === "number" ? v.stock : null,
        sku: v.sku ?? null,
        imageUrl: v.imageUrl ?? null,
      });
      continue;
    }

    // ignore invalid variant shapes silently
  }

  return out;
}

// Drop fields not present in DB (e.g., shortDescription if you removed it from the model)
function stripUnsupportedProductFields<T extends ProductInput>(data: T) {
  const { ...rest } = data as any;
  // If your DB has shortDescription column, you can pass it in a controlled way:
  // return { ...rest, shortDescription }; // only if column exists
  return rest; // DB doesn't have shortDescription: drop it
}

@Route("admin/product")
@Tags("Product")
@Security("ADMIN_BEARER_TOKEN")
export class ProductControllerAdmin extends BaseController {
  /** READ */
  @Get("/")
  public async read(@Query() id?: string): Promise<any> {
    const include = {
      categories: { select: { id: true, name: true } },
      tags: { select: { id: true, name: true } },
      files: { select: { id: true, path: true } },
      variants: {
        select: {
          id: true,
          optionType: true,
          optionValue: true,
          price: true,
          stock: true,
          sku: true,
          imageUrl: true,
        },
        orderBy: { id: "asc" },
      },
    } as const;

    if (id) {
      const item = await prisma.product.findFirst({ where: { id }, include });
      if (!item) return this.notFoundRes(RESOURCE, id);
      const p = JSON.parse(JSON.stringify(item));
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        shortDescription: p.shortDescription ?? null,
        price: p.price,
        stock: p.stock,
        imageUrl: p.imageUrl ?? null,
        createdAt: new Date(p.createdAt).toISOString(),
        updatedAt: new Date(p.updatedAt).toISOString(),
        categories: p.categories || [],
        tags: p.tags || [],
        files: p.files || [],
        variants: (p.variants || []) as VariantReadDTO[],   // <-- present
      };
    }

    const list = await prisma.product.findMany({ include, orderBy: { createdAt: "desc" } });
    const plain = JSON.parse(JSON.stringify(list));
    return plain.map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      shortDescription: p.shortDescription ?? null,
      price: p.price,
      stock: p.stock,
      imageUrl: p.imageUrl ?? null,
      createdAt: new Date(p.createdAt).toISOString(),
      updatedAt: new Date(p.updatedAt).toISOString(),
      categories: p.categories || [],
      tags: p.tags || [],
      files: p.files || [],
      variants: (p.variants || []) as VariantReadDTO[],     // <-- present
    }));
  }


  /** CREATE */
  /** CREATE */
@Post("/")
public async create(@Body() data: ProductInput): Promise<MsgRes> {
  const { categoryIds, tagIds, fileIds, variants, ...rest } = data;
  const productData = stripUnsupportedProductFields(rest);

  // --- Validate related records before connecting ---
  const [validCategories, validTags, validFiles] = await Promise.all([
    categoryIds?.length
      ? prisma.category.findMany({ where: { id: { in: categoryIds } }, select: { id: true } })
      : [],
    tagIds?.length
      ? prisma.tag.findMany({ where: { id: { in: tagIds } }, select: { id: true } })
      : [],
    fileIds?.length
      ? prisma.uploadFile.findMany({ where: { id: { in: fileIds.filter(Boolean) } }, select: { id: true } })
      : [],
  ]);

  const created = await prisma.product.create({
    data: {
      ...productData,
      ...(validCategories.length && {
        categories: { connect: validCategories.map((c) => ({ id: c.id })) },
      }),
      ...(validTags.length && {
        tags: { connect: validTags.map((t) => ({ id: t.id })) },
      }),
      ...(validFiles.length && {
        files: { connect: validFiles.map((f) => ({ id: f.id })) },
      }),
    },
  });

  // --- Handle variants (relational) ---
  const rows = normalizeVariants(variants);
  if (rows.length) {
    await prisma.productVariant.createMany({
      data: rows.map((r) => ({
        productId: created.id,
        optionType: r.optionType,
        optionValue: r.optionValue,
        price: r.price,
        stock: r.stock,
        sku: r.sku,
        imageUrl: r.imageUrl,
      })),
    });
  }

  return this.createRes(RESOURCE);
}


  /** UPDATE */
  @Patch("/")
  public async update(@Body() data: ProductInput & { id: string }): Promise<MsgRes> {
    const { id, categoryIds, tagIds, fileIds, variants, ...rest } = data;

    const productData = rest

    const updateData: any = { ...productData };

    if (Array.isArray(categoryIds)) {
      updateData.categories = { set: categoryIds.map((cid) => ({ id: cid })) };
    }
    if (Array.isArray(tagIds)) {
      updateData.tags = { set: tagIds.map((tid) => ({ id: tid })) };
    }
    if (Array.isArray(fileIds)) {
      updateData.files = { set: fileIds.filter(Boolean).map((fid) => ({ id: fid })) };
    }

    await prisma.product.update({ where: { id }, data: updateData });

    // replace variants if provided
    if (variants) {
      await prisma.productVariant.deleteMany({ where: { productId: id } });
      const rows = normalizeVariants(variants);
      if (rows.length) {
        await prisma.productVariant.createMany({
          data: rows.map((r) => ({
            productId: id,
            optionType: r.optionType,
            optionValue: r.optionValue,
            price: r.price,
            stock: r.stock,
            sku: r.sku,
            imageUrl: r.imageUrl,
          })),
        });
      }
    }

    return this.updateRes(RESOURCE);
  }

  @Delete("/")
  public async delete(@Query() id: string): Promise<MsgRes> {
    const found = await prisma.product.findUnique({ where: { id } });
    if (!found) return this.notFoundRes("Product");

    await prisma.$transaction([
      // 1) remove children that have FK to product
      prisma.productVariant.deleteMany({ where: { productId: id } }),
      prisma.cartItem.deleteMany({ where: { productId: id } }),
      prisma.orderItem.deleteMany({ where: { productId: id } }),
      prisma.wishlist.deleteMany({ where: { productId: id } }),

      // 2) disconnect implicit M2M joins (categories/tags/files)
      prisma.product.update({
        where: { id },
        data: { categories: { set: [] }, tags: { set: [] }, files: { set: [] } },
      }),

      // 3) finally delete the product
      prisma.product.delete({ where: { id } }),
    ]);

    return this.deleteRes("Product");
  }

}
