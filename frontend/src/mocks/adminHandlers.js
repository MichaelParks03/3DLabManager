import { http, HttpResponse, delay } from 'msw';
import {
  mockAdminItems,
  mockAdminUsers,
  mockAdminLabs,
  mockAdminIssues,
  mockReportsData,
} from './adminData.js';

// Make copies that we can mutate
let items = [...mockAdminItems];
let users = [...mockAdminUsers];
let labs = [...mockAdminLabs];
let issues = [...mockAdminIssues];

const simulateNetworkDelay = async () => {
  await delay(Math.floor(Math.random() * 300) + 200);
};

export const adminHandlers = [
  // ========== ITEMS ==========
  // GET /api/admin/items
  http.get('/api/admin/items', async ({ request }) => {
    await simulateNetworkDelay();

    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    const category = url.searchParams.get('category');
    const status = url.searchParams.get('status');

    let filtered = items;

    if (query) {
      const searchTerm = query.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm) ||
          item.category.toLowerCase().includes(searchTerm) ||
          item.lab.toLowerCase().includes(searchTerm)
      );
    }

    if (category && category !== 'all') {
      filtered = filtered.filter((item) => item.category === category);
    }

    if (status && status !== 'all') {
      filtered = filtered.filter((item) => item.status === status);
    }

    return HttpResponse.json({
      success: true,
      data: filtered,
    });
  }),

  // POST /api/admin/items
  http.post('/api/admin/items', async ({ request }) => {
    await simulateNetworkDelay();

    const body = await request.json();
    const newItem = {
      id: `ITM-${String(items.length + 1).padStart(3, '0')}`,
      ...body,
      updatedAt: new Date().toISOString(),
    };

    items.push(newItem);

    return HttpResponse.json({
      success: true,
      data: newItem,
    });
  }),

  // PATCH /api/admin/items/:id
  http.patch('/api/admin/items/:id', async ({ params, request }) => {
    await simulateNetworkDelay();

    const { id } = params;
    const body = await request.json();
    const index = items.findIndex((item) => item.id === id);

    if (index === -1) {
      return HttpResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
    }

    items[index] = {
      ...items[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json({
      success: true,
      data: items[index],
    });
  }),

  // PATCH /api/admin/items/bulk-status
  http.patch('/api/admin/items/bulk-status', async ({ request }) => {
    await simulateNetworkDelay();

    const { ids, status } = await request.json();

    ids.forEach((id) => {
      const index = items.findIndex((item) => item.id === id);
      if (index !== -1) {
        items[index].status = status;
        items[index].updatedAt = new Date().toISOString();
      }
    });

    return HttpResponse.json({
      success: true,
      data: { updated: ids.length },
    });
  }),

  // ========== USERS ==========
  // GET /api/admin/users
  http.get('/api/admin/users', async () => {
    await simulateNetworkDelay();

    return HttpResponse.json({
      success: true,
      data: users,
    });
  }),

  // PATCH /api/admin/users/:id/role
  http.patch('/api/admin/users/:id/role', async ({ params, request }) => {
    await simulateNetworkDelay();

    const { id } = params;
    const { role } = await request.json();
    const index = users.findIndex((user) => user.id === id);

    if (index === -1) {
      return HttpResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    users[index].role = role;

    return HttpResponse.json({
      success: true,
      data: users[index],
    });
  }),

  // ========== LABS ==========
  // GET /api/admin/labs
  http.get('/api/admin/labs', async () => {
    await simulateNetworkDelay();

    return HttpResponse.json({
      success: true,
      data: labs,
    });
  }),

  // PATCH /api/admin/labs/:id
  http.patch('/api/admin/labs/:id', async ({ params, request }) => {
    await simulateNetworkDelay();

    const { id } = params;
    const body = await request.json();
    const index = labs.findIndex((lab) => lab.id === id);

    if (index === -1) {
      return HttpResponse.json(
        { success: false, error: 'Lab not found' },
        { status: 404 }
      );
    }

    labs[index] = {
      ...labs[index],
      ...body,
      roomsCount: body.rooms?.length || labs[index].roomsCount,
    };

    return HttpResponse.json({
      success: true,
      data: labs[index],
    });
  }),

  // ========== ISSUES ==========
  // GET /api/admin/issues
  http.get('/api/admin/issues', async () => {
    await simulateNetworkDelay();

    return HttpResponse.json({
      success: true,
      data: issues,
    });
  }),

  // PATCH /api/admin/issues/:id
  http.patch('/api/admin/issues/:id', async ({ params, request }) => {
    await simulateNetworkDelay();

    const { id } = params;
    const body = await request.json();
    const index = issues.findIndex((issue) => issue.id === id);

    if (index === -1) {
      return HttpResponse.json(
        { success: false, error: 'Issue not found' },
        { status: 404 }
      );
    }

    issues[index] = {
      ...issues[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json({
      success: true,
      data: issues[index],
    });
  }),

  // POST /api/admin/issues/:id/notes
  http.post('/api/admin/issues/:id/notes', async ({ params, request }) => {
    await simulateNetworkDelay();

    const { id } = params;
    const { note } = await request.json();
    const index = issues.findIndex((issue) => issue.id === id);

    if (index === -1) {
      return HttpResponse.json(
        { success: false, error: 'Issue not found' },
        { status: 404 }
      );
    }

    // In a real app, this would add to a notes array
    issues[index].updatedAt = new Date().toISOString();

    return HttpResponse.json({
      success: true,
      data: { note, addedAt: new Date().toISOString() },
    });
  }),

  // ========== REPORTS ==========
  // GET /api/admin/reports
  http.get('/api/admin/reports', async ({ request }) => {
    await simulateNetworkDelay();

    const url = new URL(request.url);
    const _days = url.searchParams.get('days') || '30';

    // In a real app, this would filter by date range
    // For now, return static data
    return HttpResponse.json({
      success: true,
      data: mockReportsData,
    });
  }),
];
