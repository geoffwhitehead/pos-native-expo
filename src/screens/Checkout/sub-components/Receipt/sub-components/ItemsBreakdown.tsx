import withObservables from '@nozbe/with-observables';
import React from 'react';
import { Divider, Text, View } from '../../../../../core';
import type { Bill, BillItem, PriceGroup } from '../../../../../models';
import { ItemsBreakdownByPriceGroup } from './ItemsBreakdownByPriceGroup';

type ItemsBreakdownOuterProps = {
  bill: Bill;
  readonly: boolean;
  onSelect: (bI: BillItem) => void;
};

type ItemsBreakdownInnerProps = {
  priceGroupsInUse: PriceGroup[];
};

export const ItemsBreakdownInner: React.FC<ItemsBreakdownOuterProps & ItemsBreakdownInnerProps> = ({
  readonly,
  onSelect,
  priceGroupsInUse,
  bill,
  ...props
}) => {
  return (
    <View {...props}>
      <Text>Items</Text>
      <Divider/>
      {priceGroupsInUse.map(priceGroupInUse => {
        return (
          <ItemsBreakdownByPriceGroup
            key={priceGroupInUse.id}
            bill={bill}
            priceGroup={priceGroupInUse}
            readonly={readonly}
            onSelect={onSelect}
          />
        );
      })}
    </View>
  );
};

const enhance = component =>
  withObservables<ItemsBreakdownOuterProps, ItemsBreakdownInnerProps>(['bill'], ({ bill }) => ({
    bill,
    priceGroupsInUse: bill.priceGroupsInUse,
  }))(component);

export const ItemsBreakdown = enhance(ItemsBreakdownInner);
