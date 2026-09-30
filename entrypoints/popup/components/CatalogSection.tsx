import type { CatalogSnapshot } from '@/lib/catalog/signals';
import { Empty, Row } from '@/ui/components/Row';

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
          <Empty tone="error">
            {snapshot.note ?? 'Nada retornado pelo catálogo.'}
          </Empty>
        </section>
      );
    }

    return (
      <section>
        <h2>Produto</h2>
        <Row label="Nome" value={product.productName} />
        <Row
          label="productId"
          value={<code>{product.productId}</code>}
          copy={String(product.productId)}
        />
        {product.productReference && (
          <Row
            label="Referência"
            value={<code>{product.productReference}</code>}
            copy={product.productReference}
          />
        )}
        {product.brand && (
          <Row
            label="Marca"
            value={`${product.brand}${product.brandId ? ` (${product.brandId})` : ''}`}
          />
        )}
        {product.categoryId && (
          <Row
            label="categoryId"
            value={<code>{product.categoryId}</code>}
            copy={String(product.categoryId)}
          />
        )}
        {product.categories.length > 0 && (
          <Row label="Categoria" value={product.categories[0]} />
        )}
        <Row
          label="SKUs"
          value={`${product.skus.length} · ${product.skus.filter((sku) => sku.available).length} disponíveis`}
        />

        {product.skus.length > 0 && (
          <details className="sku-table">
            <summary>SKUs ({product.skus.length})</summary>
            <table>
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">SKU</th>
                  <th scope="col">Estoque</th>
                  <th scope="col">Preço</th>
                </tr>
              </thead>
              <tbody>
                {product.skus.map((sku) => (
                  <tr key={sku.id}>
                    <td>
                      <code>{sku.id}</code>
                    </td>
                    <td title={sku.sellerName ?? undefined}>
                      {sku.name}
                      {(sku.ean || sku.refId) && (
                        <span className="sku-meta">
                          {sku.ean ? `EAN ${sku.ean}` : ''}
                          {sku.ean && sku.refId ? ' · ' : ''}
                          {sku.refId ? `ref ${sku.refId}` : ''}
                        </span>
                      )}
                    </td>
                    <td>
                      {sku.available ? (
                        <span
                          className="sku-stock sku-stock-ok"
                          title={
                            sku.quantity != null ? `${sku.quantity} un.` : undefined
                          }
                        >
                          disponível
                        </span>
                      ) : (
                        <span className="sku-stock">indisponível</span>
                      )}
                    </td>
                    <td className="sku-price">
                      {money(sku.price)}
                      {sku.listPrice != null && sku.listPrice !== sku.price && (
                        <span className="sku-meta">de {money(sku.listPrice)}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
        {category?.id && (
          <Row
            label="categoryId"
            value={<code>{category.id}</code>}
            copy={String(category.id)}
          />
        )}
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
