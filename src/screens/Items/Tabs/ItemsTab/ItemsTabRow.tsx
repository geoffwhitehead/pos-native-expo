import withObservables from '@nozbe/with-observables';
import React from 'react';
import { StyleSheet } from 'react-native';
import { HStack, ListItem, Text } from '../../../../core';
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
}) => {
  return (
    <ListItem onPress={() => onPressItem(item)} style={[item.isActive && styles.activeRow]}>
      <HStack flex={1} alignItems="center" justifyContent="space-between">
        <HStack flex={1} style={styles.item}>
          <Text>{`${index + 1}: ${title}`}</Text>
          {!!subtitle && (
            <Text note>{subtitle}</Text>
          )}
        </HStack>
        <HStack w="80px" justifyContent="flex-end">
          <Text>Edit</Text>
        </HStack>
      </HStack>
    </ListItem>
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
