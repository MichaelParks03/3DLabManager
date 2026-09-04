import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ItemCard from '../ItemCard';

const mockItem = {
  id: 'PRS001',
  name: 'Prusa MK3S 3D Printer',
  category: 'Printer',
  status: 'available',
  locationPath: 'ERB 202 > North Bench',
  thumbnailUrl: '/images/prusa.jpg',
  amazonLink: 'https://amazon.com/prusa',
};

describe('ItemCard', () => {
  it('should render item name', () => {
    render(
      <MemoryRouter>
        <ItemCard item={mockItem} />
      </MemoryRouter>
    );

    expect(screen.getByText('Prusa MK3S 3D Printer')).toBeInTheDocument();
  });

  it('should render item ID', () => {
    render(
      <MemoryRouter>
        <ItemCard item={mockItem} />
      </MemoryRouter>
    );

    expect(screen.getByText('PRS001')).toBeInTheDocument();
  });

  it('should render item category', () => {
    render(
      <MemoryRouter>
        <ItemCard item={mockItem} />
      </MemoryRouter>
    );

    expect(screen.getAllByText('Printer')[0]).toBeInTheDocument();
  });

  it('should render item location', () => {
    render(
      <MemoryRouter>
        <ItemCard item={mockItem} />
      </MemoryRouter>
    );

    expect(screen.getByText(/ERB 202/i)).toBeInTheDocument();
  });

  it('should render status chip for available items', () => {
    render(
      <MemoryRouter>
        <ItemCard item={mockItem} />
      </MemoryRouter>
    );

    expect(screen.getByText('AVAILABLE')).toBeInTheDocument();
  });

  it('should render status chip for checked out items', () => {
    const checkedOutItem = { ...mockItem, status: 'checked_out' };

    render(
      <MemoryRouter>
        <ItemCard item={checkedOutItem} />
      </MemoryRouter>
    );

    expect(screen.getByText('CHECKED OUT')).toBeInTheDocument();
  });

  it('should render status chip for broken items', () => {
    const brokenItem = { ...mockItem, status: 'broken' };

    render(
      <MemoryRouter>
        <ItemCard item={brokenItem} />
      </MemoryRouter>
    );

    expect(screen.getByText('BROKEN')).toBeInTheDocument();
  });

  it('should render Amazon link when available', () => {
    render(
      <MemoryRouter>
        <ItemCard item={mockItem} />
      </MemoryRouter>
    );

    const amazonLink = screen.getByText(/View on Amazon/i).closest('a');
    expect(amazonLink).toBeInTheDocument();
    expect(amazonLink).toHaveAttribute('href', mockItem.amazonLink);
    expect(amazonLink).toHaveAttribute('target', '_blank');
    expect(amazonLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should not render Amazon link when not available', () => {
    const itemWithoutAmazonLink = { ...mockItem, amazonLink: null };

    render(
      <MemoryRouter>
        <ItemCard item={itemWithoutAmazonLink} />
      </MemoryRouter>
    );

    expect(screen.queryByText(/View on Amazon/i)).not.toBeInTheDocument();
  });

  it('should link to item detail page', () => {
    render(
      <MemoryRouter>
        <ItemCard item={mockItem} />
      </MemoryRouter>
    );

    const card = screen.getByText('View Details').closest('a');
    expect(card).toHaveAttribute('href', '/item/PRS001');
  });

  it('should render thumbnail image with correct src', () => {
    render(
      <MemoryRouter>
        <ItemCard item={mockItem} />
      </MemoryRouter>
    );

    const image = screen.getByAltText('Prusa MK3S 3D Printer thumbnail');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', mockItem.thumbnailUrl);
  });

  it('should render View Details link', () => {
    render(
      <MemoryRouter>
        <ItemCard item={mockItem} />
      </MemoryRouter>
    );

    expect(screen.getByText('View Details')).toBeInTheDocument();
  });

  it('should display fallback icon when category is shown', () => {
    render(
      <MemoryRouter>
        <ItemCard item={mockItem} />
      </MemoryRouter>
    );

    // The InventoryIcon should be rendered as fallback
    const inventoryIcon = screen.getByTestId('InventoryIcon');
    expect(inventoryIcon).toBeInTheDocument();
  });
});
