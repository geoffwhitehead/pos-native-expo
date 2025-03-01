import withObservables from '@nozbe/with-observables';
import React, { useContext } from 'react';
import { OrganizationContext } from '../../../../../contexts/OrganizationContext';
import { Divider, HStack, Text, View } from '../../../../../core';
import type { Bill, BillItem, PriceGroup } from '../../../../../models';
import { ItemBreakdown } from './ItemBreakdown';

type ItemsBreakdownByPriceGroupOuterProps = {
  bill: Bill;
  readonly: boolean;
  onSelect: (bI: BillItem) => void;
  priceGroup: PriceGroup;
  backgroundColor?: string;
};

type ItemsBreakdownByPriceGroupInnerProps = {
  billItems: BillItem[];
  billItemsCount: number;
};

export const ItemsBreakdownByPriceGroupInner: React.FC<ItemsBreakdownByPriceGroupOuterProps &
  ItemsBreakdownByPriceGroupInnerProps> = ({ billItems, onSelect, priceGroup, readonly, billItemsCount, ...props }) => {
  const {
    organization: { currency },
  } = useContext(OrganizationContext);

  return (
    <View {...props}>
      <HStack style={{ backgroundColor: priceGroup.color || '#f4f4f4' }}>
        <Text style={{ fontWeight: 'bold' }}>{priceGroup.name}</Text>
        <Text>{` (${billItemsCount} items) `}</Text>
        <Divider/>
      </HStack>
      {billItems.map(billItem => (
        <ItemBreakdown
          key={billItem.id}
          billItem={billItem}
          readonly={readonly}
          onSelect={onSelect}
          currency={currency}
        />
      ))}
    </View>
  );
};

const enhance = component =>
  withObservables<ItemsBreakdownByPriceGroupOuterProps, ItemsBreakdownByPriceGroupInnerProps>(
    ['bill', 'priceGroup'],
    ({ bill, priceGroup }) => ({
      bill,
      priceGroup,
      billItems: bill.billItemsByPriceGroup(priceGroup.id),
      billItemsCount: bill.billItemsByPriceGroupNoVoids(priceGroup.id).observeCount(),
    }),
  )(component);

export const ItemsBreakdownByPriceGroup = enhance(ItemsBreakdownByPriceGroupInner);
