import type { Component } from '../../domain.js';

/** Prepara enlaces de búsqueda; no representa ofertas ni disponibilidad comprobadas. */
export function catalogResponse(component: Component) {
    const query = encodeURIComponent(component.name);
    return {
        ...component,
        image: component.image ?? null,
        links_tiendas: {
            amazon: `https://www.amazon.com/s?k=${query}`,
            mercadolibre: `https://listado.mercadolibre.com.co/${query}`
        }
    };
}
