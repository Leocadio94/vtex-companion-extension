/** Recorte dos dados de catálogo que interessam ao painel. */

export interface SkuSummary {
  id: string;
  name: string;
  ean: string | null;
  refId: string | null;
  sellerId: string | null;
  sellerName: string | null;
  available: boolean;
  quantity: number | null;
  price: number | null;
  listPrice: number | null;
  images: number;
}

export interface ProductSummary {
  productId: string;
  productName: string;
  linkText: string | null;
  productReference: string | null;
  brand: string | null;
  brandId: string | null;
  categoryId: string | null;
  categories: string[];
  skus: SkuSummary[];
}

export interface CategorySummary {
  id: string | null;
  name: string | null;
  path: string[];
  hasChildren: boolean | null;
}

export interface SearchState {
  query: string | null;
  map: string | null;
  order: string | null;
  page: string | null;
  /** Segmentos de caminho que compõem a navegação facetada. */
  segments: string[];
}

export interface CatalogSnapshot {
  kind: 'product' | 'category' | 'none';
  product?: ProductSummary | null;
  category?: CategorySummary | null;
  search?: SearchState;
  /** Mensagem quando a busca falhou ou não achou nada. */
  note?: string;
}
