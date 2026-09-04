import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBar from '../SearchBar';

describe('SearchBar', () => {
  it('should render with placeholder text', () => {
    const mockOnChange = vi.fn();
    const mockOnClear = vi.fn();
    const mockOnSearch = vi.fn();

    render(
      <SearchBar
        value=""
        onChange={mockOnChange}
        onClear={mockOnClear}
        onSearch={mockOnSearch}
      />
    );

    const input = screen.getByPlaceholderText(/Search items by name, category, or location/i);
    expect(input).toBeInTheDocument();
  });

  it('should render with custom placeholder', () => {
    const mockOnChange = vi.fn();
    const customPlaceholder = 'Search for equipment...';

    render(
      <SearchBar
        value=""
        onChange={mockOnChange}
        onClear={vi.fn()}
        onSearch={vi.fn()}
        placeholder={customPlaceholder}
      />
    );

    expect(screen.getByPlaceholderText(customPlaceholder)).toBeInTheDocument();
  });

  it('should display the current value', () => {
    const mockOnChange = vi.fn();

    render(
      <SearchBar
        value="Prusa"
        onChange={mockOnChange}
        onClear={vi.fn()}
        onSearch={vi.fn()}
      />
    );

    const input = screen.getByDisplayValue('Prusa');
    expect(input).toBeInTheDocument();
  });

  it('should call onChange when user types', async () => {
    const user = userEvent.setup();
    const mockOnChange = vi.fn();

    render(
      <SearchBar
        value=""
        onChange={mockOnChange}
        onClear={vi.fn()}
        onSearch={vi.fn()}
      />
    );

    const input = screen.getByRole('textbox', { name: /search items/i });
    await user.type(input, 'P');

    expect(mockOnChange).toHaveBeenCalledWith('P');
  });

  it('should call onSearch when Enter key is pressed', async () => {
    const user = userEvent.setup();
    const mockOnSearch = vi.fn();

    render(
      <SearchBar
        value="Prusa"
        onChange={vi.fn()}
        onClear={vi.fn()}
        onSearch={mockOnSearch}
      />
    );

    const input = screen.getByRole('textbox');
    await user.type(input, '{Enter}');

    expect(mockOnSearch).toHaveBeenCalled();
  });

  it('should call onSearch when search button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnSearch = vi.fn();

    render(
      <SearchBar
        value="Prusa"
        onChange={vi.fn()}
        onClear={vi.fn()}
        onSearch={mockOnSearch}
      />
    );

    const searchButtons = screen.getAllByRole('button', { name: /search/i });
    // The second search button is the one in the end adornment
    await user.click(searchButtons[searchButtons.length - 1]);

    expect(mockOnSearch).toHaveBeenCalled();
  });

  it('should show clear button when value is present', () => {
    render(
      <SearchBar
        value="Prusa"
        onChange={vi.fn()}
        onClear={vi.fn()}
        onSearch={vi.fn()}
      />
    );

    const clearButton = screen.getByRole('button', { name: /clear search/i });
    expect(clearButton).toBeInTheDocument();
  });

  it('should not show clear button when value is empty', () => {
    render(
      <SearchBar
        value=""
        onChange={vi.fn()}
        onClear={vi.fn()}
        onSearch={vi.fn()}
      />
    );

    const clearButton = screen.queryByRole('button', { name: /clear search/i });
    expect(clearButton).not.toBeInTheDocument();
  });

  it('should call onClear when clear button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnClear = vi.fn();

    render(
      <SearchBar
        value="Prusa"
        onChange={vi.fn()}
        onClear={mockOnClear}
        onSearch={vi.fn()}
      />
    );

    const clearButton = screen.getByRole('button', { name: /clear search/i });
    await user.click(clearButton);

    expect(mockOnClear).toHaveBeenCalled();
  });

  it('should disable search button when value is empty', () => {
    render(
      <SearchBar
        value=""
        onChange={vi.fn()}
        onClear={vi.fn()}
        onSearch={vi.fn()}
      />
    );

    const searchButtons = screen.getAllByRole('button', { name: /search/i });
    // The icon button for search is the last one
    expect(searchButtons[searchButtons.length - 1]).toBeDisabled();
  });

  it('should enable search button when value is present', () => {
    render(
      <SearchBar
        value="Prusa"
        onChange={vi.fn()}
        onClear={vi.fn()}
        onSearch={vi.fn()}
      />
    );

    const searchButtons = screen.getAllByRole('button', { name: /search/i });
    // The icon button for search is the last one
    expect(searchButtons[searchButtons.length - 1]).not.toBeDisabled();
  });

  it('should disable all interactions when disabled prop is true', () => {
    render(
      <SearchBar
        value="Prusa"
        onChange={vi.fn()}
        onClear={vi.fn()}
        onSearch={vi.fn()}
        disabled={true}
      />
    );

    const input = screen.getByRole('textbox');
    const searchButtons = screen.getAllByRole('button', { name: /search/i });
    const clearButton = screen.getByRole('button', { name: /clear search/i });

    expect(input).toBeDisabled();
    expect(searchButtons[searchButtons.length - 1]).toBeDisabled();
    expect(clearButton).toBeDisabled();
  });

  it('should have proper accessibility attributes', () => {
    render(
      <SearchBar
        value=""
        onChange={vi.fn()}
        onClear={vi.fn()}
        onSearch={vi.fn()}
      />
    );

    const input = screen.getByRole('textbox', { name: /search items/i });
    expect(input).toHaveAttribute('aria-label', 'Search items');
    expect(input).toHaveAttribute('autocomplete', 'off');
  });
});
