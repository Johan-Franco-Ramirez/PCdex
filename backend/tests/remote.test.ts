import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from './fixtures.js';
import { categoryView, querySchema, view } from '../src/modules/remote/remote.service.js';
test('adapta categorías y especificaciones al frontend remoto',()=>{const cpu=view(fixture('CPU'));assert.equal(cpu.category,'cpu');assert.equal(cpu.specs.socket,'AM5');assert.equal(cpu.specs.cores,8);assert.equal(cpu.currency,'COP');assert.equal(categoryView().data.length,8);});
test('los componentes sin precio conservan el valor desconocido',()=>{const gpu=fixture('GPU');gpu.precio=null;assert.equal(view(gpu).estimatedPrice,null);});
test('admite paginación remota y rechaza parámetros inválidos',()=>{assert.equal(querySchema.parse({page:'2',limit:'100'}).page,2);assert.equal(querySchema.safeParse({limit:'101'}).success,false);});
