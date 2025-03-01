import withObservables from '@nozbe/with-observables';
import React from 'react';
import { StyleSheet } from 'react-native';
import { HStack, Icon, ListItem, Text } from '../../../../../core';
import type { Item, ItemPrice } from '../../../../../models';
import { formatNumber } from '../../../../../utils';

interface CategoryItemRowOuterProps {
  item: Item;
  isActive: boolean;
  onPressItem: (i: Item, mCount: number) => void;
  itemPrice: ItemPrice;
  currency: string;
}

interface CategoryItemRowInnerProps {
  modifierCount: any;
}

const CategoryItemRowInner: React.FC<CategoryItemRowOuterProps & CategoryItemRowInnerProps> = ({
  isActive,
  item,
  modifierCount,
  onPressItem,
  itemPrice,
  currency,
  ...props
}) => {
  const onPress = () => onPressItem(item, modifierCount);

  return (
    <ListItem
      {...props}
      style={isActive ? styles.activeRow : { backgroundColor: 'white' }}
      icon
      key={item.id}
      onPress={onPress}
    >
      <HStack flex={1} alignItems="center" justifyContent="space-between">
        <HStack flex={1}>
          <Text>{item.name}</Text>
        </HStack>
        <HStack flex={1} justifyContent="center">
          {modifierCount > 0 ? <Icon style={{ color: 'lightgrey' }} size={24} name="arrow-forward" /> : null}
        </HStack>
        <HStack flex={1} justifyContent="flex-end">
          <Text style={{ color: 'grey' }}>{formatNumber(itemPrice.price, currency)}</Text>
        </HStack>
      </HStack>
    </ListItem>
  );
};

export const CategoryItemRow = withObservables<CategoryItemRowOuterProps, CategoryItemRowInnerProps>(
  ['item', 'itemPrice'],
  ({ item, itemPrice }) => ({
    item,
    itemPrice,
    modifierCount: item.modifiers.observeCount(),
  }),
)(CategoryItemRowInner);

const styles = StyleSheet.create({
  activeRow: {
    backgroundColor: '#cde1f9',
  },
});
