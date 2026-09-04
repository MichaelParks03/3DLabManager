import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminProtectedRoute from '../AdminProtectedRoute';

// Mock the useAuth hook
const mockUseAuth = vi.fn();

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('AdminProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading state when auth is loading', () => {
    mockUseAuth.mockReturnValue({
      loading: true,
      isAuthenticated: false,
      user: null,
    });

    render(
      <MemoryRouter>
        <AdminProtectedRoute>
          <div>Admin Content</div>
        </AdminProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('should render children when user is authenticated as admin', () => {
    mockUseAuth.mockReturnValue({
      loading: false,
      isAuthenticated: true,
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin',
      },
    });

    render(
      <MemoryRouter>
        <AdminProtectedRoute>
          <div>Admin Content</div>
        </AdminProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('should render children when user is authenticated as staff', () => {
    mockUseAuth.mockReturnValue({
      loading: false,
      isAuthenticated: true,
      user: {
        id: 'staff-123',
        email: 'staff@example.com',
        role: 'staff',
      },
    });

    render(
      <MemoryRouter>
        <AdminProtectedRoute>
          <div>Admin Content</div>
        </AdminProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('should render children when user is authenticated as labManager', () => {
    mockUseAuth.mockReturnValue({
      loading: false,
      isAuthenticated: true,
      user: {
        id: 'manager-123',
        email: 'manager@example.com',
        role: 'labManager',
      },
    });

    render(
      <MemoryRouter>
        <AdminProtectedRoute>
          <div>Admin Content</div>
        </AdminProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('should render children when user is authenticated as viewer', () => {
    mockUseAuth.mockReturnValue({
      loading: false,
      isAuthenticated: true,
      user: {
        id: 'viewer-123',
        email: 'viewer@example.com',
        role: 'viewer',
      },
    });

    render(
      <MemoryRouter>
        <AdminProtectedRoute>
          <div>Admin Content</div>
        </AdminProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('should render children for authenticated users without specific role requirement', () => {
    mockUseAuth.mockReturnValue({
      loading: false,
      isAuthenticated: true,
      user: {
        id: 'user-123',
        email: 'student@example.com',
        role: 'student',
      },
    });

    render(
      <MemoryRouter>
        <AdminProtectedRoute>
          <div>Admin Content</div>
        </AdminProtectedRoute>
      </MemoryRouter>
    );

    // Without requiredRole prop, any authenticated user can access
    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });
});
