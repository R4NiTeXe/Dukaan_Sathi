import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Modal from '@/components/ui/Modal';

describe('Modal', () => {
  it('renders nothing when closed', () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Test">
        content
      </Modal>
    );
    expect(screen.queryByText('Test')).not.toBeInTheDocument();
  });

  it('renders title and children when open', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="New Customer">
        <input placeholder="Name" />
      </Modal>
    );
    expect(screen.getByText('New Customer')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test">
        content
      </Modal>
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the backdrop is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(
      <Modal isOpen={true} onClose={onClose} title="Test">
        content
      </Modal>
    );
    const backdrop = container.querySelector('.fixed.inset-0');
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('locks page scroll while open and restores it after', () => {
    const { unmount } = render(
      <Modal isOpen={true} onClose={() => {}} title="Test">
        content
      </Modal>
    );
    expect(document.body.style.overflow).toBe('hidden');

    unmount();
    expect(document.body.style.overflow).toBe('unset');
  });
});
