import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from './fixtures.js';
import { categoryView, querySchema, view } from '../src/modules/remote/remote.service.js';
import { serializarComponente } from '../src/modules/catalog/catalog.types.js';
test('el catálogo principal incluye búsquedas de tienda al serializar componentes',()=>{const item=serializarComponente(fixture('CPU','Ryzen 5 7600'));assert.equal(new URL(item.links_tiendas.amazon).searchParams.get('k'),'Ryzen 5 7600');assert.equal(decodeURIComponent(new URL(item.links_tiendas.mercadolibre).pathname.slice(1)),'Ryzen 5 7600');});
test('adapta categorías, especificaciones y enlaces de tiendas al frontend remoto',()=>{const cpu=view(fixture('CPU','Ryzen 5 7600'));assert.equal(cpu.category,'cpu');assert.equal(cpu.specs.socket,'AM5');assert.equal(cpu.specs.cores,8);assert.equal(cpu.currency,'COP');assert.deepEqual(cpu.links_tiendas,{amazon:'https://www.amazon.com/s?k=Ryzen%205%207600',mercadolibre:'https://listado.mercadolibre.com.co/Ryzen%205%207600'});assert.equal(categoryView().data.length,8);});
test('los componentes sin precio conservan el valor desconocido',()=>{const gpu=fixture('GPU');gpu.precio=null;assert.equal(view(gpu).estimatedPrice,null);});
test('admite paginación remota y rechaza parámetros inválidos',()=>{assert.equal(querySchema.parse({page:'2',limit:'100'}).page,2);assert.equal(querySchema.safeParse({limit:'101'}).success,false);});
