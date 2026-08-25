import type { CatalogSnapshot } from '@/lib/catalog/signals';
import { Empty, Row } from './Row';

function money(value: number | null): string {
  return value == null ? '—' : (value / 100).toFixed(2);
}

export function CatalogSection({
  snapshot,
  adminUrl,
}: {
  snapshot: CatalogSnapshot;
  adminUrl: string | null;
}) {
  if (snapshot.kind === 'product') {
    const product = snapshot.product;

    if (!product) {
      return (
        <section>
          <h2>Produto</h2>
          <Empty>{snapshot.note ?? 'Nada retornado pelo catálogo.'}</Empty>
        </section>
      );
    }

    return (
      <section>
        <h2>Produto</h2>
        <Row label="Nome" value={product.productName} />
        <Row label="productId" value={<code>{product.productId}</code>} />
        {product.productReference && (
          <Row label="Referência" value={<code>{product.productReference}</code>} />
        )}
        {product.brand && (
          <Row
            label="Marca"
            value={`${product.brand}${product.brandId ? ` (${product.brandId})` : ''}`}
          />
        )}
        {product.categoryId && (
          <Row label="categoryId" value={<code>{product.categoryId}</code>} />
        )}
        {product.categories.length > 0 && (
          <Row label="Categoria" value={product.categories[0]} />
        )}
        <Row
          label="SKUs"
          value={`${product.skus.length} · ${product.skus.filter((sku) => sku.available).length} disponíveis`}
        />

        {product.skus.length > 0 && (
          <details className="frames">
            <summary>SKUs ({product.skus.length})</summary>
            <ul>
              {product.skus.map((sku) => (
                <li key={sku.id}>
                  <code>
                    {sku.id} · {sku.name}
                  </code>
                  <span>
                    {sku.available
                      ? `disponível${sku.quantity != null ? ` (${sku.quantity})` : ''}`
                      : 'indisponível'}
                    {' · '}
                    {money(sku.price)}
                    {sku.listPrice != null && sku.listPrice !== sku.price
                      ? ` de ${money(sku.listPrice)}`
                      : ''}
                    {sku.sellerName ? ` · ${sku.sellerName}` : ''}
                  </span>
                  {(sku.ean || sku.refId) && (
                    <span>
                      {sku.ean ? `EAN ${sku.ean}` : ''}
                      {sku.ean && sku.refId ? ' · ' : ''}
                      {sku.refId ? `ref ${sku.refId}` : ''}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </details>
        )}

        {adminUrl && (
          <div className="actions">
            <button
              type="button"
              onClick={() => void browser.tabs.create({ url: adminUrl })}
            >
              Abrir no admin
            </button>
          </div>
        )}
      </section>
    );
  }

  if (snapshot.kind === 'category') {
    const category = snapshot.category;
    const search = snapshot.search;

    return (
      <section>
        <h2>Listagem</h2>
        {category?.name && <Row label="Categoria" value={category.name} />}
        {category?.id && <Row label="categoryId" value={<code>{category.id}</code>} />}
        {category && category.path.length > 0 && (
          <Row label="Caminho" value={category.path.join(' › ')} />
        )}
        {search?.query && <Row label="Termo" value={search.query} />}
        {search?.map && <Row label="map" value={<code>{search.map}</code>} />}
        {search?.order && <Row label="Ordenação" value={<code>{search.order}</code>} />}
        {search?.page && <Row label="Página" value={search.page} />}
        {snapshot.note && <Empty>{snapshot.note}</Empty>}
      </section>
    );
  }

  return null;
}
