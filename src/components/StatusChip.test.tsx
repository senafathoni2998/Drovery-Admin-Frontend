import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import StatusChip from './StatusChip';

describe('StatusChip', () => {
  it('humanizes a single-word status', () => {
    render(<StatusChip status="DELIVERED" />);
    expect(screen.getByText('Delivered')).toBeInTheDocument();
  });

  it('humanizes an UPPER_SNAKE status into sentence case', () => {
    render(<StatusChip status="IN_TRANSIT" />);
    expect(screen.getByText('In transit')).toBeInTheDocument();
  });

  it('humanizes a multi-word failure status', () => {
    render(<StatusChip status="DELIVERY_FAILED" />);
    expect(screen.getByText('Delivery failed')).toBeInTheDocument();
  });
});
