import React from 'react';
import type { PriceGroup } from '../models/PriceGroup';

type PriceGroupContextProps = {
  setPriceGroup: (priceGroup: PriceGroup) => void;
  priceGroup: PriceGroup;
};

export const PriceGroupContext = React.createContext<PriceGroupContextProps>({
  setPriceGroup: null as any,
  priceGroup: null as any,
});
