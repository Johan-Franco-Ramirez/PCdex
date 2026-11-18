import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
try {
  const { StoreLinks } = await vite.ssrLoadModule('/src/components/catalog/StoreLinks.tsx')
  const { ComponentImage } = await vite.ssrLoadModule('/src/components/catalog/ComponentImage.tsx')
  const { toCatalog } = await vite.ssrLoadModule('/src/services/api.ts')
  const links = { amazon: 'https://www.amazon.com/s?k=CPU', mercadolibre: 'https://listado.mercadolibre.com.co/CPU' }
  const item = toCatalog({ id: 'test', name: 'CPU', brand: 'Marca', model: 'Modelo', category: 'cpu', description: 'Ejemplo', estimatedPrice: null, priceSource: null, priceReferenceDate: null, priceKind: 'DEMO', currency: 'COP', active: true, specs: {}, links_tiendas: links })
  assert.deepEqual(item.links_tiendas, links)
  const photo = toCatalog({ id: 'test', name: 'CPU', brand: 'Marca', model: 'Modelo', category: 'cpu', description: 'Ejemplo', estimatedPrice: null, priceSource: null, priceReferenceDate: null, priceKind: 'DEMO', currency: 'COP', active: true, specs: {}, image: 'https://example.test/cpu.png' })
  assert.equal(photo.image, 'https://example.test/cpu.png')
  assert.match(renderToStaticMarkup(createElement(ComponentImage, { item: photo })), /src="https:\/\/example\.test\/cpu\.png"/)
  assert.match(renderToStaticMarkup(createElement(ComponentImage, { item })), /Ilustración genérica/)
  assert.doesNotMatch(renderToStaticMarkup(createElement(ComponentImage, { item: { ...item, image: 'javascript:alert(1)' } })), /<img/)
  const render = value => renderToStaticMarkup(createElement(StoreLinks, { links: value }))
  const both = render(item.links_tiendas)
  assert.match(both, /Ver en Amazon/)
  assert.match(both, /Ver en Mercado Libre/)
  assert.equal((both.match(/target="_blank"/g) ?? []).length, 2)
  assert.equal((both.match(/rel="noopener noreferrer"/g) ?? []).length, 2)
  assert.equal(render(undefined), '')
  assert.equal(render({}), '')
  assert.equal(render({ amazon: '', mercadolibre: 'javascript:alert(1)' }), '')
  assert.equal(render({ amazon: 'https://user:pass@example.com' }), '')
  const one = render({ amazon: 'https://www.amazon.com/', mercadolibre: null })
  assert.match(one, /Ver en Amazon/)
  assert.doesNotMatch(one, /Ver en Mercado Libre/)
  console.log('Enlaces de tiendas: mapeo, visualización condicional y protocolos verificados.')
} finally {
  await vite.close()
}
