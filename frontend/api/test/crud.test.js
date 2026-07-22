import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockQuery = vi.fn();

function passThrough(perm) {
  return (fn) => fn;
}

function mockRes() {
  const res = {
    status: vi.fn(() => res),
    json: vi.fn(() => res),
  };
  return res;
}

function mockReq(overrides = {}) {
  return {
    method: 'GET',
    query: {},
    body: {},
    user: { id: 1, role: 'admin' },
    headers: {},
    ...overrides,
  };
}

function crudOpts(overrides = {}) {
  return {
    permissionPrefix: 'test',
    singularName: 'test',
    requirePermission: passThrough,
    sql: { query: mockQuery },
    ...overrides,
  };
}

const { createCRUD, safeIdent, safeOrder } = await import('../crud.js');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('safeIdent', () => {
  it('wraps normal column name in double quotes', () => {
    expect(safeIdent('name')).toBe('"name"');
  });

  it('wraps table name in double quotes', () => {
    expect(safeIdent('clients')).toBe('"clients"');
  });

  it('escapes double quotes inside name', () => {
    expect(safeIdent('col"um')).toBe('"col""um"');
  });

  it('escapes multiple double quotes', () => {
    expect(safeIdent('a"b"c')).toBe('"a""b""c"');
  });

  it('handles empty string', () => {
    expect(safeIdent('')).toBe('""');
  });
});

describe('safeOrder', () => {
  it('wraps column and keeps DESC', () => {
    expect(safeOrder('name DESC')).toBe('"name" DESC');
  });

  it('wraps column and keeps ASC', () => {
    expect(safeOrder('name ASC')).toBe('"name" ASC');
  });

  it('wraps bare column (no direction)', () => {
    expect(safeOrder('name')).toBe('"name"');
  });

  it('handles created_at DESC', () => {
    expect(safeOrder('created_at DESC')).toBe('"created_at" DESC');
  });

  it('normalizes lowercase direction to uppercase', () => {
    expect(safeOrder('name desc')).toBe('"name" DESC');
  });

  it('handles column with extra whitespace', () => {
    expect(safeOrder('name   ASC')).toBe('"name" ASC');
  });
});

describe('createCRUD return shape', () => {
  it('returns object with list, get, create, update, remove', () => {
    const crud = createCRUD('test_table', crudOpts());
    expect(crud).toHaveProperty('list');
    expect(crud).toHaveProperty('get');
    expect(crud).toHaveProperty('create');
    expect(crud).toHaveProperty('update');
    expect(crud).toHaveProperty('remove');
    expect(typeof crud.list).toBe('function');
    expect(typeof crud.get).toBe('function');
    expect(typeof crud.create).toBe('function');
    expect(typeof crud.update).toBe('function');
    expect(typeof crud.remove).toBe('function');
  });
});

describe('list', () => {
  it('calls sql.query with SELECT and correct ORDER BY', async () => {
    const crud = createCRUD('test_table', crudOpts());
    mockQuery
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ total: 0 }]);

    const req = mockReq();
    const res = mockRes();
    await crud.list(req, res);

    expect(mockQuery.mock.calls[0][0]).toBe(
      'SELECT * FROM "test_table"  ORDER BY "created_at" DESC LIMIT 100 OFFSET 0'
    );
    expect(mockQuery.mock.calls[1][0]).toBe(
      'SELECT COUNT(*)::int as total FROM "test_table" '
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ items: [], total: 0 });
  });

  it('applies search filter with ILIKE when searchFields defined', async () => {
    const crud = createCRUD('test_table', crudOpts({ searchFields: ['name', 'email'] }));
    mockQuery
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ total: 0 }]);

    const req = mockReq({ query: { search: 'john' } });
    const res = mockRes();
    await crud.list(req, res);

    expect(mockQuery.mock.calls[0][0]).toContain('ILIKE $1');
    expect(mockQuery.mock.calls[0][1]).toEqual(['%john%']);
  });

  it('returns 405 for non-GET method', async () => {
    const crud = createCRUD('test_table', crudOpts());
    const req = mockReq({ method: 'POST' });
    const res = mockRes();
    await crud.list(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: 'Método no permitido' });
    expect(mockQuery).not.toHaveBeenCalled();
  });
});

describe('get', () => {
  it('calls sql.query with SELECT WHERE id', async () => {
    const crud = createCRUD('test_table', crudOpts());
    mockQuery.mockResolvedValueOnce([{ id: 1, name: 'Test' }]);

    const req = mockReq({ query: { id: 1 } });
    const res = mockRes();
    await crud.get(req, res);

    expect(mockQuery).toHaveBeenCalledWith(
      'SELECT * FROM "test_table" WHERE id = $1',
      [1]
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ id: 1, name: 'Test' });
  });

  it('returns 404 when no result found', async () => {
    const crud = createCRUD('test_table', crudOpts());
    mockQuery.mockResolvedValueOnce([]);

    const req = mockReq({ query: { id: 999 } });
    const res = mockRes();
    await crud.get(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'test no encontrado' });
  });

  it('returns 405 for non-GET method', async () => {
    const crud = createCRUD('test_table', crudOpts());
    const req = mockReq({ method: 'PUT' });
    const res = mockRes();
    await crud.get(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(mockQuery).not.toHaveBeenCalled();
  });
});

describe('create', () => {
  it('calls sql.query with INSERT and returns 201', async () => {
    const crud = createCRUD('test_table', crudOpts());
    mockQuery.mockResolvedValueOnce([{ id: 1, name: 'New Item' }]);

    const req = mockReq({ method: 'POST', body: { name: 'New Item' } });
    const res = mockRes();
    await crud.create(req, res);

    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/^INSERT INTO "test_table"/);
    expect(sql).toContain('"name"');
    expect(sql).toContain('"created_by"');
    expect(sql).toContain('RETURNING *');
    expect(params).toContain('New Item');
    expect(params).toContain(1);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 1, name: 'New Item' });
  });

  it('returns 405 for non-POST method', async () => {
    const crud = createCRUD('test_table', crudOpts());
    const req = mockReq({ method: 'GET' });
    const res = mockRes();
    await crud.create(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('returns 403 for client role with clientFilter', async () => {
    const crud = createCRUD('test_table', crudOpts({ clientFilter: 'client_id' }));
    const req = mockReq({
      method: 'POST',
      body: { name: 'X' },
      user: { id: 1, role: 'client' },
    });
    const res = mockRes();
    await crud.create(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(mockQuery).not.toHaveBeenCalled();
  });
});

describe('update', () => {
  it('calls sql.query with UPDATE SET and WHERE id', async () => {
    const crud = createCRUD('test_table', crudOpts());
    mockQuery.mockResolvedValueOnce([{ id: 1, name: 'Updated' }]);

    const req = mockReq({ method: 'PUT', body: { id: 1, name: 'Updated' } });
    const res = mockRes();
    await crud.update(req, res);

    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toMatch(/^UPDATE "test_table" SET/);
    expect(sql).toContain('"name" = $1');
    expect(sql).toContain('"updated_at"');
    expect(sql).toContain('WHERE id = $3');
    expect(sql).toContain('RETURNING *');
    expect(params).toContain('Updated');
    expect(params).toContain(1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 400 when no id provided', async () => {
    const crud = createCRUD('test_table', crudOpts());
    const req = mockReq({ method: 'PUT', body: { name: 'Updated' } });
    const res = mockRes();
    await crud.update(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'ID requerido' });
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('returns 404 when no result found', async () => {
    const crud = createCRUD('test_table', crudOpts());
    mockQuery.mockResolvedValueOnce([]);

    const req = mockReq({ method: 'PUT', body: { id: 999, name: 'X' } });
    const res = mockRes();
    await crud.update(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 405 for non-PUT method', async () => {
    const crud = createCRUD('test_table', crudOpts());
    const req = mockReq({ method: 'POST' });
    const res = mockRes();
    await crud.update(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(mockQuery).not.toHaveBeenCalled();
  });
});

describe('remove', () => {
  it('calls sql.query with DELETE and returns success', async () => {
    const crud = createCRUD('test_table', crudOpts());
    mockQuery.mockResolvedValueOnce([{ id: 1 }]);

    const req = mockReq({ method: 'DELETE', query: { id: 1 } });
    const res = mockRes();
    await crud.remove(req, res);

    expect(mockQuery).toHaveBeenCalledWith(
      'DELETE FROM "test_table" WHERE id = $1 RETURNING id',
      [1]
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'test eliminado' });
  });

  it('returns 404 when no result found', async () => {
    const crud = createCRUD('test_table', crudOpts());
    mockQuery.mockResolvedValueOnce([]);

    const req = mockReq({ method: 'DELETE', query: { id: 999 } });
    const res = mockRes();
    await crud.remove(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 405 for non-DELETE method', async () => {
    const crud = createCRUD('test_table', crudOpts());
    const req = mockReq({ method: 'GET' });
    const res = mockRes();
    await crud.remove(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('returns 403 for client role with clientFilter', async () => {
    const crud = createCRUD('test_table', crudOpts({ clientFilter: 'client_id' }));
    const req = mockReq({
      method: 'DELETE',
      query: { id: 1 },
      user: { id: 1, role: 'client' },
    });
    const res = mockRes();
    await crud.remove(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(mockQuery).not.toHaveBeenCalled();
  });
});
