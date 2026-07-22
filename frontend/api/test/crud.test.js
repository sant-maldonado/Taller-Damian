import { describe, it, expect, vi } from 'vitest';
import { safeIdent, safeOrder, createCRUD } from '../crud.js';

describe('safeIdent', () => {
  it('wraps in double quotes', () => {
    expect(safeIdent('name')).toBe('"name"');
  });

  it('escapes double quotes', () => {
    expect(safeIdent('na"me')).toBe('"na""me"');
  });

  it('handles column names with underscores', () => {
    expect(safeIdent('created_at')).toBe('"created_at"');
  });

  it('handles empty string', () => {
    expect(safeIdent('')).toBe('""');
  });

  it('handles numeric-ish strings', () => {
    expect(safeIdent('123')).toBe('"123"');
  });
});

describe('safeOrder', () => {
  it('handles column DESC', () => {
    expect(safeOrder('created_at DESC')).toBe('"created_at" DESC');
  });

  it('handles column ASC', () => {
    expect(safeOrder('name ASC')).toBe('"name" ASC');
  });

  it('handles bare column', () => {
    expect(safeOrder('name')).toBe('"name"');
  });

  it('normalizes case for direction', () => {
    expect(safeOrder('name desc')).toBe('"name" DESC');
  });

  it('handles single column with no direction', () => {
    expect(safeOrder('id')).toBe('"id"');
  });
});

describe('createCRUD', () => {
  it('returns object with list, get, create, update, remove', () => {
    const mockSql = vi.fn();
    const crud = createCRUD('test_table', {
      singularName: 'test',
      permissionPrefix: 'test',
      sql: mockSql,
      requirePermission: () => (fn) => fn,
    });
    expect(crud).toHaveProperty('list');
    expect(crud).toHaveProperty('get');
    expect(crud).toHaveProperty('create');
    expect(crud).toHaveProperty('update');
    expect(crud).toHaveProperty('remove');
  });

  function makeSql(queries) {
    let callIdx = 0;
    return { query: vi.fn((...args) => Promise.resolve(queries[callIdx++] || [])) };
  }

  function makeRes() {
    const res = { status: vi.fn(() => res), json: vi.fn(() => res) };
    return res;
  }

  it('list calls sql.query with SELECT', async () => {
    const mockSql = makeSql([[], [{ total: 0 }]]);

    const crud = createCRUD('items', {
      singularName: 'item',
      permissionPrefix: 'items',
      sql: mockSql,
      requirePermission: () => (fn) => fn,
    });

    const req = { method: 'GET', query: {}, user: { id: 1, role: 'admin' } };
    const res = makeRes();
    await crud.list(req, res);

    expect(mockSql.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT * FROM "items"')
    );
  });

  it('get calls sql.query with WHERE id', async () => {
    const mockSql = makeSql([[{ id: 1, name: 'Test' }]]);

    const crud = createCRUD('items', {
      singularName: 'item',
      permissionPrefix: 'items',
      sql: mockSql,
      requirePermission: () => (fn) => fn,
    });

    const req = { method: 'GET', query: { id: 1 }, user: { id: 1, role: 'admin' } };
    const res = makeRes();
    await crud.get(req, res);

    expect(mockSql.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE id = $1'),
      [1]
    );
  });

  it('create calls sql.query with INSERT', async () => {
    const mockSql = makeSql([[{ id: 1, name: 'New' }]]);

    const crud = createCRUD('items', {
      singularName: 'item',
      permissionPrefix: 'items',
      sql: mockSql,
      requirePermission: () => (fn) => fn,
    });

    const req = { method: 'POST', body: { name: 'New' }, user: { id: 1, role: 'admin' } };
    const res = makeRes();
    await crud.create(req, res);

    expect(mockSql.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO "items"'),
      expect.arrayContaining(['New'])
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('update calls sql.query with UPDATE SET', async () => {
    const mockSql = makeSql([[{ id: 1, name: 'Updated' }]]);

    const crud = createCRUD('items', {
      singularName: 'item',
      permissionPrefix: 'items',
      sql: mockSql,
      requirePermission: () => (fn) => fn,
    });

    const req = { method: 'PUT', body: { id: 1, name: 'Updated' }, user: { id: 1, role: 'admin' } };
    const res = makeRes();
    await crud.update(req, res);

    expect(mockSql.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE "items" SET'),
      expect.arrayContaining(['Updated', 1])
    );
  });

  it('remove calls sql.query with DELETE', async () => {
    const mockSql = makeSql([[{ id: 1 }]]);

    const crud = createCRUD('items', {
      singularName: 'item',
      permissionPrefix: 'items',
      sql: mockSql,
      requirePermission: () => (fn) => fn,
    });

    const req = { method: 'DELETE', query: { id: 1 }, user: { id: 1, role: 'admin' } };
    const res = makeRes();
    await crud.remove(req, res);

    expect(mockSql.query).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM "items"'),
      [1]
    );
  });
});
