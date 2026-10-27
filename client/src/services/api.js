export const getApiBase = () => {
  const custom = localStorage.getItem('equisplit_backend_url');
  if (custom) return `${custom.replace(/\/+$/, '')}/api`;
  const envApi = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || '';
  return envApi ? `${envApi.replace(/\/+$/, '')}/api` : '/api';
};

/**
 * Standard fetch helper with automatic JWT injection, timeout, and error extraction
 */
async function request(endpoint, options = {}, timeoutMs = 25000) {
  const token = localStorage.getItem('equisplit_token');
  const apiBase = getApiBase();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(`${apiBase}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (netErr) {
    clearTimeout(timeoutId);
    if (netErr.name === 'AbortError') {
      throw new Error(
        'Connection timed out. If your backend is hosted on Render free tier, it may be waking up from sleep (~40s). Please wait a moment and try again.'
      );
    }
    throw new Error(
      `Cannot connect to backend server (${apiBase}). If on Vercel, please set VITE_API_URL or use the Backend URL setting below.`
    );
  } finally {
    clearTimeout(timeoutId);
  }

  // Check if response is HTML instead of JSON (happens when Vercel rewrites /api to index.html)
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(
      'Backend returned HTML instead of JSON. Your frontend cannot reach your backend. Please set your Render Backend URL in Vercel settings or use the Backend URL configuration below.'
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('equisplit_token');
      localStorage.removeItem('equisplit_user');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (name, email, password) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  getMe: () => request('/auth/me'),

  searchUsers: (query) => request(`/auth/search?q=${encodeURIComponent(query)}`),

  // Groups
  getGroups: () => request('/groups'),

  getGroupById: (id) => request(`/groups/${id}`),

  createGroup: (groupData) =>
    request('/groups', {
      method: 'POST',
      body: JSON.stringify(groupData),
    }),

  joinGroupByCode: (inviteCode) =>
    request('/groups/join', {
      method: 'POST',
      body: JSON.stringify({ inviteCode }),
    }),

  addMember: (groupId, email) =>
    request(`/groups/${groupId}/members`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  removeMember: (groupId, userId) =>
    request(`/groups/${groupId}/members/${userId}`, {
      method: 'DELETE',
    }),

  // Expenses
  getExpenses: (groupId, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.category && filters.category !== 'all') params.append('category', filters.category);
    return request(`/groups/${groupId}/expenses?${params.toString()}`);
  },

  addExpense: (groupId, expenseData) =>
    request(`/groups/${groupId}/expenses`, {
      method: 'POST',
      body: JSON.stringify(expenseData),
    }),

  updateExpense: (expenseId, expenseData) =>
    request(`/expenses/${expenseId}`, {
      method: 'PUT',
      body: JSON.stringify(expenseData),
    }),

  deleteExpense: (expenseId) =>
    request(`/expenses/${expenseId}`, {
      method: 'DELETE',
    }),

  // Settlements
  getSettlements: (groupId) => request(`/groups/${groupId}/settlements`),

  recordSettlement: (groupId, settlementData) =>
    request(`/groups/${groupId}/settlements`, {
      method: 'POST',
      body: JSON.stringify(settlementData),
    }),

  // Analytics & Balances
  getGroupBalances: (groupId) => request(`/groups/${groupId}/balances`),

  getGroupAnalytics: (groupId) => request(`/groups/${groupId}/analytics`),

  // Activity Log
  getGroupActivity: (groupId) => request(`/groups/${groupId}/activity`),
};
