import { Chip } from '@mui/material';

import type { DeliveryStatus } from '../models/enums';
import { deliveryStatusColor, humanizeEnum } from '../models/enums';

export default function StatusChip({
  status,
  size = 'small',
}: {
  status: DeliveryStatus;
  size?: 'small' | 'medium';
}) {
  return (
    <Chip
      label={humanizeEnum(status)}
      color={deliveryStatusColor(status)}
      size={size}
    />
  );
}
