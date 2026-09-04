import { http, HttpResponse, delay } from 'msw';
import { mockItems } from './data.js';
import { adminHandlers } from './adminHandlers.js';

// Simulate network latency and occasional failures
const simulateNetworkConditions = async () => {
  // Random delay between 300-700ms
  const delayTime = Math.floor(Math.random() * 400) + 300;
  await delay(delayTime);

  // 5% chance of failure
  if (Math.random() < 0.05) {
    throw new Error('Simulated network error');
  }
};

export const handlers = [
  // Admin handlers
  ...adminHandlers,
  // Allow image requests and placeholder services to pass through without interception
  http.get(/\.(jpg|jpeg|png|gif|svg|webp)(\?.*)?$/i, () => {
    return; // Pass through to actual network
  }),

  // Allow placeholder services to pass through
  http.get(/^https?:\/\/(via\.placeholder\.com|placeholder\.com|placehold\.co|picsum\.photos)/, () => {
    return; // Pass through to actual network
  }),

  // GET /api/items - Get items with optional filtering
  http.get('/api/items', async ({ request }) => {
    try {
      await simulateNetworkConditions();

      const url = new URL(request.url);
      const query = url.searchParams.get('q') || '';
      const category = url.searchParams.get('category') || '';
      const status = url.searchParams.get('status') || '';

      let filteredItems = mockItems;

      // Filter by search query (name, category, location)
      if (query) {
        const searchTerm = query.toLowerCase();
        filteredItems = filteredItems.filter(item =>
          item.name.toLowerCase().includes(searchTerm) ||
          item.category.toLowerCase().includes(searchTerm) ||
          item.locationPath.toLowerCase().includes(searchTerm)
        );
      }

      // Filter by category
      if (category && category !== 'all') {
        filteredItems = filteredItems.filter(item =>
          item.category === category
        );
      }

      // Filter by status
      if (status && status !== 'all') {
        filteredItems = filteredItems.filter(item =>
          item.status === status
        );
      }

      return HttpResponse.json({
        success: true,
        data: filteredItems
      });
    } catch (_error) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Failed to fetch items. Please try again.'
        },
        { status: 500 }
      );
    }
  }),

  // GET /api/items/:id - Get single item
  http.get('/api/items/:id', async ({ params }) => {
    try {
      await simulateNetworkConditions();

      const { id } = params;
      const item = mockItems.find(item => item.id === id);

      if (!item) {
        return HttpResponse.json(
          {
            success: false,
            error: 'Item not found'
          },
          { status: 404 }
        );
      }

      return HttpResponse.json({
        success: true,
        data: item
      });
    } catch (_error) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Failed to fetch item. Please try again.'
        },
        { status: 500 }
      );
    }
  }),

  // POST /api/issues - Submit an issue report
  http.post('/api/issues', async ({ request }) => {
    try {
      await simulateNetworkConditions();

      const body = await request.json();
      const { itemId, type, notes } = body;

      // Validate required fields
      if (!itemId || !type) {
        return HttpResponse.json(
          {
            success: false,
            error: 'Item ID and issue type are required'
          },
          { status: 400 }
        );
      }

      // Check if item exists
      const item = mockItems.find(item => item.id === itemId);
      if (!item) {
        return HttpResponse.json(
          {
            success: false,
            error: 'Item not found'
          },
          { status: 404 }
        );
      }

      // In a real app, we would save this to a database
      const issueId = `ISS-${Date.now()}`;

      return HttpResponse.json({
        success: true,
        data: {
          id: issueId,
          itemId,
          type,
          notes,
          status: 'submitted',
          createdAt: new Date().toISOString()
        }
      });
    } catch (_error) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Failed to submit issue. Please try again.'
        },
        { status: 500 }
      );
    }
  })
];