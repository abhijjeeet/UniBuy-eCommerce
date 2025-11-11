export interface FileDTO { id: string; path: string }
export interface CategoryDTO { id: string; name: string }
export interface TagDTO { id: string; name: string }

export interface VariantItemDTO {
  id?: string;
  optionType?: string | null;
  optionValue?: string | null;
  price?: number | null;
  stock?: number | null;
  sku?: string | null;
  imageUrl?: string | null;
}

export interface VariantDTO {
  id: string;
  optionType?: string | null;
  optionValue?: string | null;
  price?: number | null;
  stock?: number | null;
  sku?: string | null;
  imageUrl?: string | null;
}

export interface ProductInputDTO {
  id?: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string;

  categoryIds?: string[];
  tagIds?: string[];
  fileIds?: string[];

  // optional list to create/replace variants
  variants?: VariantItemDTO[];
}

export interface ProductDTO {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string | null;
  stock: number;
  categories?: CategoryDTO[];
  tags?: TagDTO[];
  files?: FileDTO[];
  variants?: VariantItemDTO[];

  createdAt: string;
  updatedAt: string;
}


// 1) Keep your old minimal shape as a base
interface ProductReadBaseDTO {
  id: string;
  name: string;
  description: string;
  shortDescription?: string | null;
  price: number;
  stock: number;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  categories: { id: string; name: string }[];
  tags: { id: string; name: string }[];
  files: { id: string; path: string }[];
}

// 2) Add variant DTO
interface VariantReadDTO {
  id: string;
  optionType: string | null;
  optionValue: string | null;
  price: number | null;
  stock: number | null;
  sku: string | null;
  imageUrl: string | null;
}

// 3) Final DTO that the endpoint returns
type ProductReadDTO = ProductReadBaseDTO & {
  variants: VariantReadDTO[];
};


export interface CartItemDTO {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  sku?: string | null;
  variantId?: string | null;
  variantSelection?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

