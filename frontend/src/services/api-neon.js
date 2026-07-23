const API_BASE = import.meta.env.VITE_API_URL || '';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Error en la solicitud');
  }

  return data;
}

// Auth
export const auth = {
  login: (identifier, password) =>
    request('/api/auth?action=login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    }),
  register: (data) =>
    request('/api/auth?action=register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  me: () => request('/api/auth?action=me'),
  changePassword: (data) =>
    request('/api/auth?action=change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// CRUD helpers
function createEndpoint(path) {
  return {
    list: (params = {}) => {
      const filtered = Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''));
      const query = new URLSearchParams(filtered).toString();
      return request(`/api/${path}${query ? `?${query}` : ''}`);
    },
    get: (id) => request(`/api/${path}?id=${id}`),
    create: (data) =>
      request(`/api/${path}`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (data) =>
      request(`/api/${path}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    remove: (id) =>
      request(`/api/${path}?id=${id}`, {
        method: 'DELETE',
      }),
  };
}

export const clients = createEndpoint('clients');
export const vehicles = createEndpoint('vehicles');
vehicles.history = (id) => request(`/api/vehicles?id=${id}&action=history`);
export const orders = {
  ...createEndpoint('orders'),
  addService: (data) => request('/api/orders?action=add-service', { method: 'POST', body: JSON.stringify(data) }),
  removeService: (id) => request(`/api/orders?action=remove-service&id=${id}`, { method: 'DELETE' }),
};
export const services = createEndpoint('services');
export const invoices = createEndpoint('invoices');
export const hours = {
  list: (params = {}) => {
    const filtered = Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''));
    const query = new URLSearchParams({ ...filtered, action: 'list-hours' }).toString();
    return request(`/api/invoices?${query}`);
  },
  create: (data) =>
    request('/api/invoices?action=hours-create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (data) =>
    request('/api/invoices?action=hours-update', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  remove: (id) =>
    request(`/api/invoices?action=hours-delete&id=${id}`, {
      method: 'DELETE',
    }),
};
export const users = createEndpoint('users');
export const roles = {
  list: () => request('/api/users?action=list-roles'),
};

export const groq = {
  chat: (data) =>
    request('/api/vehicles?action=chat', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export default { auth, clients, vehicles, orders, services, invoices, hours, users, roles, groq };
