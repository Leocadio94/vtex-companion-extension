/** Chamadas de API VTEX que valem ter a um clique. */

import type { RunnerInput } from './request';

export interface Preset extends RunnerInput {
  id: string;
  group: string;
  label: string;
  /** Trechos entre chaves são para o usuário substituir. */
  note?: string;
}

const preset = (
  id: string,
  group: string,
  label: string,
  method: string,
  url: string,
  extra: Partial<RunnerInput> & { note?: string } = {},
): Preset => ({
  id,
  group,
  label,
  method,
  url,
  headers: '',
  body: '',
  ...extra,
});

export const PRESETS: Preset[] = [
  preset('sessions', 'Sessão', 'Sessão atual', 'GET', '/api/sessions?items=*'),
  preset('segments', 'Sessão', 'Segmento', 'GET', '/api/segments'),

  preset(
    'orderform',
    'Checkout',
    'OrderForm atual',
    'GET',
    '/api/checkout/pub/orderForm',
  ),
  preset(
    'simulation',
    'Checkout',
    'Simulação de carrinho',
    'POST',
    '/api/checkout/pub/orderForms/simulation?sc=1',
    {
      body: '{\n  "items": [{ "id": "{skuId}", "quantity": 1, "seller": "1" }],\n  "postalCode": "01310-100",\n  "country": "BRA"\n}',
      note: 'Troque {skuId} e o CEP.',
    },
  ),

  preset(
    'product-slug',
    'Catálogo',
    'Produto por slug',
    'GET',
    '/api/catalog_system/pub/products/search/{slug}/p',
    { note: 'Troque {slug} pelo linkText do produto.' },
  ),
  preset(
    'product-id',
    'Catálogo',
    'Produto por productId',
    'GET',
    '/api/catalog_system/pub/products/search?fq=productId:{productId}',
  ),
  preset(
    'sku-id',
    'Catálogo',
    'Produto por skuId',
    'GET',
    '/api/catalog_system/pub/products/search?fq=skuId:{skuId}',
  ),
  preset(
    'category-tree',
    'Catálogo',
    'Árvore de categorias',
    'GET',
    '/api/catalog_system/pub/category/tree/3',
  ),
  preset(
    'brands',
    'Catálogo',
    'Marcas',
    'GET',
    '/api/catalog_system/pub/brand/list',
  ),

  preset(
    'is-search',
    'Intelligent Search',
    'Busca de produtos',
    'GET',
    '/api/io/_v/api/intelligent-search/product_search/?query={termo}&count=10',
  ),
  preset(
    'is-autocomplete',
    'Intelligent Search',
    'Autocomplete',
    'GET',
    '/api/io/_v/api/intelligent-search/autocomplete_suggestions?query={termo}',
  ),
  preset(
    'is-facets',
    'Intelligent Search',
    'Facetas',
    'GET',
    '/api/io/_v/api/intelligent-search/facets/?query={termo}',
  ),

  preset('oms-orders', 'OMS', 'Últimos pedidos', 'GET', '/api/oms/pvt/orders?per_page=5', {
    note: 'Precisa de sessão de admin — use numa aba do myvtex.com.',
  }),
  preset('oms-order', 'OMS', 'Pedido por id', 'GET', '/api/oms/pvt/orders/{orderId}'),

  preset(
    'md-search',
    'Master Data',
    'Buscar documentos',
    'GET',
    '/api/dataentities/{entidade}/search?_fields=_all',
    {
      headers: 'REST-Range: resources=0-9',
      note: 'O REST-Range é obrigatório; sem ele a API recusa.',
    },
  ),
  preset(
    'md-schemas',
    'Master Data',
    'Schemas da entidade',
    'GET',
    '/api/dataentities/{entidade}/schemas',
  ),

  preset(
    'docks',
    'Logística',
    'Docas',
    'GET',
    '/api/logistics/pvt/configuration/docks',
  ),
];
