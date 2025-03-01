import withObservables from '@nozbe/with-observables';
import React from 'react';
import { StyleSheet } from 'react-native';
import { HStack, Text } from '../../../../core';
import type { Item } from '../../../../models';

interface ItemsTabRowOuterProps {
  item: Item;
  isActive: boolean;
  onPressItem: (i: Item) => void;
  title: string;
  subtitle?: string;
  index: number;
}

interface ItemsTabRowInnerProps {
  item: Item;
}

const ItemsTabRowInner: React.FC<ItemsTabRowOuterProps & ItemsTabRowInnerProps> = ({
  item,
  title,
  subtitle,
  onPressItem,
  index,
  isActive
}) => {
  return (
    <HStack flex={1} alignItems="center" justifyContent="space-between" onTouchEnd={() => onPressItem(item)} style={[isActive && styles.activeRow]}>
      <HStack flex={1} style={styles.item}>
        <Text>{`${index + 1}: ${title}`}</Text>
        {!!subtitle && (
          <Text sub>{subtitle}</Text>
        )}
      </HStack>
      <HStack w="80px" justifyContent="flex-end">
        <Text>Edit</Text>
      </HStack>
    </HStack>
  );
};

export const ItemsTabRow = withObservables<ItemsTabRowOuterProps, ItemsTabRowInnerProps>(['item'], ({ item }) => ({
  item,
}))(ItemsTabRowInner);

const styles = StyleSheet.create({
  activeRow: {
    backgroundColor: '#cde1f9',
  },
  item: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
});
