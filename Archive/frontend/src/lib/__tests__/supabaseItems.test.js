import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  checkoutItem
} from '../supabaseItems';

// Mock the supabase client
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}));

describe('Supabase Items Functions', () => {
  let mockSupabase;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { supabase } = await import('../supabase');
    mockSupabase = supabase;
  });

  describe('getEquipment()', () => {
    it('should fetch all equipment successfully', async () => {
      const mockData = [
        {
          qr_code: 'PRS001',
          name: 'Prusa MK3S',
          category: 'Printer',
          status: 'available',
          location_path: 'Lab A > Desk 1',
          thumbnail_url: '/images/prusa.jpg',
          amazon_link: 'https://amazon.com/prusa',
          model_path: '/models/prusa.glb',
          scale: 1.0,
          lab_id: 'erb_202',
          x: 0,
          y: 0,
          z: 0,
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      });

      const result = await getEquipment();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('PRS001');
      expect(result[0].name).toBe('Prusa MK3S');
      expect(result[0].locationPath).toBe('Lab A > Desk 1');
    });

    it('should filter by search query', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockSupabase.from.mockReturnValue(mockChain);

      await getEquipment({ q: 'Prusa' });

      expect(mockChain.or).toHaveBeenCalledWith(
        expect.stringContaining('qr_code.ilike.%Prusa%')
      );
    });

    it('should filter by category', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockSupabase.from.mockReturnValue(mockChain);

      await getEquipment({ category: 'Printer' });

      expect(mockChain.eq).toHaveBeenCalledWith('category', 'Printer');
    });

    it('should filter by status', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockSupabase.from.mockReturnValue(mockChain);

      await getEquipment({ status: 'available' });

      expect(mockChain.eq).toHaveBeenCalledWith('status', 'available');
    });

    it('should throw error on database failure', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        }),
      });

      await expect(getEquipment()).rejects.toThrow();
    });
  });

  describe('getEquipmentById()', () => {
    it('should fetch single equipment by QR code', async () => {
      const mockData = {
        qr_code: 'PRS001',
        name: 'Prusa MK3S',
        category: 'Printer',
        status: 'available',
        location_path: 'Lab A',
        thumbnail_url: '/images/prusa.jpg',
        amazon_link: 'https://amazon.com/prusa',
        model_path: '/models/prusa.glb',
        scale: 1.0,
        lab_id: 'erb_202',
        x: 0,
        y: 0,
        z: 0,
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      });

      const result = await getEquipmentById('PRS001');

      expect(result.id).toBe('PRS001');
      expect(result.name).toBe('Prusa MK3S');
    });

    it('should throw error if equipment not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' }
        }),
      });

      await expect(getEquipmentById('INVALID')).rejects.toThrow();
    });
  });

  describe('createEquipment()', () => {
    it('should create new equipment successfully', async () => {
      const newItem = {
        id: 'NEW001',
        name: 'New Item',
        category: 'Tool',
        status: 'available',
        locationPath: 'Lab B',
        thumbnailUrl: '/images/new.jpg',
        amazonLink: 'https://amazon.com/new',
        modelPath: '/models/new.glb',
        scale: 1.0,
        labId: 'erb_203',
        x: 1,
        y: 1,
        z: 1,
      };

      const mockResponse = {
        qr_code: 'NEW001',
        name: 'New Item',
        category: 'Tool',
        status: 'available',
        location_path: 'Lab B',
        thumbnail_url: '/images/new.jpg',
        amazon_link: 'https://amazon.com/new',
        model_path: '/models/new.glb',
        scale: 1.0,
        lab_id: 'erb_203',
        x: 1,
        y: 1,
        z: 1,
      };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockResponse, error: null }),
      });

      const result = await createEquipment(newItem);

      expect(result.id).toBe('NEW001');
      expect(result.name).toBe('New Item');
    });
  });

  describe('updateEquipment()', () => {
    it('should update equipment successfully', async () => {
      const updates = {
        name: 'Updated Name',
        status: 'checked_out',
      };

      const mockResponse = {
        qr_code: 'PRS001',
        name: 'Updated Name',
        category: 'Printer',
        status: 'checked_out',
        location_path: 'Lab A',
        thumbnail_url: '/images/prusa.jpg',
        amazon_link: 'https://amazon.com/prusa',
        model_path: '/models/prusa.glb',
        scale: 1.0,
        lab_id: 'erb_202',
        x: 0,
        y: 0,
        z: 0,
      };

      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockResponse, error: null }),
      });

      const result = await updateEquipment('PRS001', updates);

      expect(result.id).toBe('PRS001');
      expect(result.name).toBe('Updated Name');
      expect(result.status).toBe('checked_out');
    });
  });

  describe('deleteEquipment()', () => {
    it('should delete equipment successfully', async () => {
      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      await expect(deleteEquipment('PRS001')).resolves.not.toThrow();
    });

    it('should throw error on deletion failure', async () => {
      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: { message: 'Deletion failed' }
        }),
      });

      await expect(deleteEquipment('PRS001')).rejects.toThrow();
    });
  });

  describe('checkoutItem()', () => {
    it('should checkout available item successfully', async () => {
      const mockEquipment = {
        id: 'uuid-123',
        qr_code: 'PRS001',
        name: 'Prusa MK3S',
        category: 'Printer',
        status: 'available',
        location_path: 'Lab A',
        thumbnail_url: '/images/prusa.jpg',
        amazon_link: 'https://amazon.com/prusa',
        model_path: '/models/prusa.glb',
        scale: 1.0,
        lab_id: 'erb_202',
        x: 0,
        y: 0,
        z: 0,
      };

      // Mock the fetch equipment call
      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const singleMock = vi.fn().mockResolvedValue({
        data: mockEquipment,
        error: null
      });

      // Mock the update call
      const updateMock = vi.fn().mockReturnThis();
      const updateEqMock = vi.fn().mockResolvedValue({ error: null });

      // Mock the insert call
      const insertMock = vi.fn().mockResolvedValue({ error: null });

      mockSupabase.from
        .mockReturnValueOnce({
          select: selectMock,
          eq: eqMock.mockReturnValueOnce({ single: singleMock }),
        })
        .mockReturnValueOnce({
          update: updateMock,
          eq: updateEqMock,
        })
        .mockReturnValueOnce({
          insert: insertMock,
        });

      const result = await checkoutItem('PRS001', 'user-123');

      expect(result.success).toBe(true);
      expect(result.item.id).toBe('PRS001');
      expect(result.item.status).toBe('checked_out');
    });

    it('should throw error if item is not available', async () => {
      const mockEquipment = {
        id: 'uuid-123',
        qr_code: 'PRS001',
        name: 'Prusa MK3S',
        status: 'checked_out', // Not available
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockEquipment,
          error: null
        }),
      });

      await expect(checkoutItem('PRS001', 'user-123')).rejects.toThrow(
        'checked_out and cannot be checked out'
      );
    });

    it('should throw error if equipment not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' }
        }),
      });

      await expect(checkoutItem('INVALID', 'user-123')).rejects.toThrow();
    });
  });
});
