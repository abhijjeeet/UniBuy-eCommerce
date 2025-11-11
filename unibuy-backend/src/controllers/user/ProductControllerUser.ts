import { Route, Tags, Get, Query, Request } from "tsoa";
import prisma from "../../../prisma/prisma";
import { BaseController, MsgRes } from "../BaseController";

/* ---------- DTOs ---------- */
interface FileDTO { id: string; path: string }
interface CategoryDTO { id: string; name: string }
interface TagDTO { id: string; name: string }

interface VariantReadDTO {
  id: string;
  optionType: string | null;
  optionValue: string | null;
  price: number | null;
  stock: number | null;
  sku: string | null;
  imageUrl: string | null;
}

interface ProductUserDTO {
  id: string;
  name: string;
  description: string;
  shortDescription?: string | null;
  price: number;
  stock: number;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  categories: CategoryDTO[];
  tags: TagDTO[];
  files: FileDTO[];
  variants: VariantReadDTO[];
}

interface Suggestion {
  type: "product" | "category";
  id: string;
  name: string;
  file?: string | null; // first file path (if any)
}
interface SuggestionRes { suggestions: Suggestion[] }

/* ---------- Helpers ---------- */
const toUserDTO = (p: any): ProductUserDTO => ({
  id: p.id,
  name: p.name,
  description: p.description,
  shortDescription: p.shortDescription ?? null,
  price: p.price,
  stock: p.stock,
  imageUrl: p.imageUrl ?? null,
  createdAt: new Date(p.createdAt).toISOString(),
  updatedAt: new Date(p.updatedAt).toISOString(),
  categories: (p.categories || []).map((c: any) => ({ id: c.id, name: c.name })),
  tags: (p.tags || []).map((t: any) => ({ id: t.id, name: t.name })),
  files: (p.files || []).map((f: any) => ({ id: f.id, path: f.path })),
  variants: (p.variants || []).map((v: any) => ({
    id: v.id,
    optionType: v.optionType,
    optionValue: v.optionValue,
    price: v.price,
    stock: v.stock,
    sku: v.sku,
    imageUrl: v.imageUrl,
  })),
});

const commonInclude = {
  categories: { select: { id: true, name: true } },
  tags:       { select: { id: true, name: true } },
  files:      { select: { id: true, path: true } },
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
    orderBy: { id: "asc" as const },
  },
} as const;

/* ---------- Controller ---------- */
@Route("user/product")
@Tags("Product")
export class ProductControllerUser extends BaseController {
  /** Get all products, optionally filtered by category or tag */
  @Get("/")
  public async list(
    @Query() categoryId?: string,
    @Query() tagId?: string
  ): Promise<ProductUserDTO[]> {
    const list = await prisma.product.findMany({
      where: {
        ...(categoryId ? { categories: { some: { id: categoryId } } } : {}),
        ...(tagId ? { tags: { some: { id: tagId } } } : {}),
      },
      include: commonInclude,
      orderBy: { createdAt: "desc" },
    });
    return list.map(toUserDTO);
  }

  /** Get single product with details (incl. variants) */
  @Get("/single")
  public async single(@Query() id: string): Promise<ProductUserDTO | MsgRes> {
    const item = await prisma.product.findFirst({
      where: { id },
      include: commonInclude,
    });
    if (!item) return this.notFoundRes("Product", id);
    return toUserDTO(item);
  }

  /** 🔍 Search suggestions (SQLite-safe, case-insensitive, parameterized) */
  @Get("/suggestions")
  public async suggestions(
    @Request() _req: any,
    @Query() q?: string
  ): Promise<SuggestionRes | MsgRes> {
    if (!q || q.trim().length < 1) return { suggestions: [] };
    const like = `%${q.trim()}%`;

    type ProductRow  = { id: string; name: string; fileUrl: string | null };
    type CategoryRow = { id: string; name: string };

    const [products, categories] = await Promise.all([
      prisma.$queryRaw<ProductRow[]>`
        SELECT p.id, p.name,
          (SELECT f.path FROM "UploadFile" f
           WHERE f."productId" = p.id
           ORDER BY f."createdAt" ASC
           LIMIT 1) AS "fileUrl"
        FROM "Product" p
        WHERE LOWER(p.name) LIKE LOWER(${like})
        LIMIT 6
      `,
      prisma.$queryRaw<CategoryRow[]>`
        SELECT c.id, c.name
        FROM "Category" c
        WHERE LOWER(c.name) LIKE LOWER(${like})
        LIMIT 6
      `,
    ]);

    const productSuggestions: Suggestion[] = products.map((p) => ({
      type: "product",
      id: p.id,
      name: p.name,
      file: p.fileUrl ?? null,
    }));

    const categorySuggestions: Suggestion[] = categories.map((c) => ({
      type: "category",
      id: c.id,
      name: c.name,
    }));

    return { suggestions: [...productSuggestions, ...categorySuggestions] };
  }
}
