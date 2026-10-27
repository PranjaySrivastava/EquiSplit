const envApi = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || '';
const API_BASE = envApi ? `${envApi.replace(/\/+$/, '')}/api` : '/api';

/**
 * Standard fetch helper with automatic JWT injection and error extraction
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('equisplit_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('equisplit_token');
      localStorage.removeItem('equisplit_user');
      // If unauthorized and not already on auth page, dispatch event
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
