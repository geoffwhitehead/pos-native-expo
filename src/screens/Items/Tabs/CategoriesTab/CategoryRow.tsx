import withObservables from '@nozbe/with-observables';
import React from 'react';
import { StyleSheet } from 'react-native';
import { Button, HStack, VStack, Text, View } from '../../../../core';
import type { Category, PrintCategory } from '../../../../models';

type CategoryRowOuterProps = {
  category: Category;
  onSelect: (category: Category) => void;
  index: number;
};

type CategoryRowInnerProps = {
  itemsCount: number;
  printCategory: PrintCategory | null;
};

const CategoryRowInner: React.FC<CategoryRowOuterProps & CategoryRowInnerProps> = ({
  category,
  onSelect,
  itemsCount,
  printCategory,
  index,
  ...props
}) => {
  return (
    <HStack flex={1} alignItems="center" justifyContent="space-between" {...props}>
      <VStack flex={1}>
        <View style={{ ...styles.name, backgroundColor: category.backgroundColor }}>
          <Text
            style={{
              ...styles.text,
              color: category.textColor,
            }}
          >{`${index + 1}: ${category.name}`}</Text>
        </View>
        <Text style={styles.text} sub>{`Assigned: ${itemsCount} Items`}</Text>
        <Text style={styles.text} sub>{`Print Category: ${printCategory?.shortName || 'None'}`}</Text>
      </VStack>
      <HStack w="80px" justifyContent="flex-end">
        <Button variant='outline' colorScheme='info' size='sm' onPress={() => onSelect(category)}>
          Edit
        </Button>
      </HStack>
    </HStack>
  );
};

const enhance = c =>
  withObservables<CategoryRowOuterProps, CategoryRowInnerProps>(['category'], ({ category }) => {
    return {
      category,
      itemsCount: category.items.observeCount(),
      printCategory: category.printCategory,
    };
  })(c);

export const CategoryRow = enhance(CategoryRowInner);

const styles = StyleSheet.create({
  text: { alignSelf: 'flex-start' },
  name: { borderRadius: 5, padding: 3, paddingLeft: 6, paddingRight: 6 },
} as const);
