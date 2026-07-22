import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auth, clients, vehicles, orders, groq } from '../services/api-neon';

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn();
  vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('test-token');
});

function mockFetchOk(body = {}) {
  global.fetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(body),
  });
}

function mockFetchFail(error = 'Error', status = 400) {
  global.fetch.mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve({ error }),
  });
}

describe('auth', () => {
  it('login sends correct endpoint, method, and body', async () => {
    mockFetchOk({ token: 'abc' });
    await auth.login('admin@test.com', '123456');

    expect(global.fetch).toHaveBeenCalledWith('/api/auth?action=login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
      body: JSON.stringify({ identifier: 'admin@test.com', password: '123456' }),
    });
  });

  it('me sends request with Authorization header', async () => {
    mockFetchOk({ user: { id: 1 } });
    await auth.me();

    const [url, config] = global.fetch.mock.calls[0];
    expect(url).toBe('/api/auth?action=me');
    expect(config.headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-token',
    });
  });
});

describe('clients', () => {
  it('list() sends GET to /api/clients', async () => {
    mockFetchOk({ data: [] });
    await clients.list();

    expect(global.fetch).toHaveBeenCalledWith('/api/clients', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
    });
  });

  it('list({ search: "test" }) sends GET with query params', async () => {
    mockFetchOk({ data: [] });
    await clients.list({ search: 'test' });

    expect(global.fetch).toHaveBeenCalledWith('/api/clients?search=test', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
    });
  });

  it('list filters out null and empty string params', async () => {
    mockFetchOk({ data: [] });
    await clients.list({ search: 'test', status: '', page: null });

    expect(global.fetch).toHaveBeenCalledWith('/api/clients?search=test', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
    });
  });

  it('create(data) sends POST with body', async () => {
    const data = { name: 'Juan', email: 'juan@test.com' };
    mockFetchOk({ id: 1 });
    await clients.create(data);

    expect(global.fetch).toHaveBeenCalledWith('/api/clients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
      body: JSON.stringify(data),
    });
  });

  it('update(data) sends PUT with body', async () => {
    const data = { id: 1, name: 'Juan Updated' };
    mockFetchOk({ id: 1 });
    await clients.update(data);

    expect(global.fetch).toHaveBeenCalledWith('/api/clients', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
      body: JSON.stringify(data),
    });
  });

  it('remove(id) sends DELETE with id param', async () => {
    mockFetchOk({ deleted: true });
    await clients.remove(5);

    expect(global.fetch).toHaveBeenCalledWith('/api/clients?id=5', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
    });
  });
});

describe('orders', () => {
  it('addService(data) sends POST to /api/orders?action=add-service', async () => {
    const data = { order_id: 1, service_id: 3 };
    mockFetchOk({ id: 1 });
    await orders.addService(data);

    expect(global.fetch).toHaveBeenCalledWith('/api/orders?action=add-service', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
      body: JSON.stringify(data),
    });
  });

  it('removeService(id) sends DELETE to correct endpoint', async () => {
    mockFetchOk({ deleted: true });
    await orders.removeService(7);

    expect(global.fetch).toHaveBeenCalledWith('/api/orders?action=remove-service&id=7', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
    });
  });
});

describe('vehicles', () => {
  it('history(id) sends GET to correct endpoint', async () => {
    mockFetchOk({ history: [] });
    await vehicles.history(4);

    expect(global.fetch).toHaveBeenCalledWith('/api/vehicles?id=4&action=history', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
    });
  });
});

describe('error handling', () => {
  it('throws Error when fetch returns non-ok response', async () => {
    mockFetchFail('Unauthorized', 401);

    await expect(auth.me()).rejects.toThrow('Unauthorized');
  });

  it('throws generic error when response has no error field', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    });

    await expect(clients.list()).rejects.toThrow('Error en la solicitud');
  });
});

describe('groq', () => {
  it('chat(data) sends POST to correct endpoint', async () => {
    const data = { message: 'hola', vehicle_id: 1 };
    mockFetchOk({ reply: 'hello' });
    await groq.chat(data);

    expect(global.fetch).toHaveBeenCalledWith('/api/vehicles?action=chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
      body: JSON.stringify(data),
    });
  });
});
