const API_BASE_URL = 'http://localhost:8000';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('access_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || data.message || 'API request failed');
  }
  return data;
}

export const authAPI = {
  login: (email, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),
};

export const superAdminAPI = {
  getOrganizations: () => request('/super-admin/organizations'),
  createOrganization: (orgData) => request('/super-admin/organization', {
    method: 'POST',
    body: JSON.stringify(orgData),
  }),
  deleteOrganization: (orgId) => request(`/super-admin/organization/${orgId}`, {
    method: 'DELETE',
  }),
};

export const clientAdminAPI = {
  getAdmins: () => request('/client-admin/all'),
  createAdmin: (adminData) => request('/client-admin/create', {
    method: 'POST',
    body: JSON.stringify(adminData),
  }),
};

export const employeeAPI = {
  getEmployees: () => request('/employee/all'),
  createEmployee: (empData) => request('/employee/create', {
    method: 'POST',
    body: JSON.stringify(empData),
  }),
};

export const modelsAPI = {
  getAllModels: () => request('/models/all'),
  createModel: (modelData) => request('/models/create', {
    method: 'POST',
    body: JSON.stringify(modelData),
  }),
};

export const tokenAPI = {
  getAllTokens: () => request('/tokens/all'),
  createToken: (tokenData) => request('/tokens/create', {
    method: 'POST',
    body: JSON.stringify(tokenData),
  }),
};

export const usageLogAPI = {
  getAllLogs: () => request('/usage-logs/all'),
  createLog: (logData) => request('/usage-logs/create', {
    method: 'POST',
    body: JSON.stringify(logData),
  }),
};

export const recommendationAPI = {
  autoAnalyze: (orgId) => request(`/recommendations/auto-analyze/${orgId || 'default'}`),
  predictCost: (reqData) => request('/recommendations/predict-cost', {
    method: 'POST',
    body: JSON.stringify(reqData),
  }),
};
