import withObservables from '@nozbe/with-observables';
import React from 'react';
import { HStack, VStack, Text, Button } from '../../../../core';
import type { Modifier } from '../../../../models';

type ModifierRowOuterProps = {
  onSelect: (modifier: Modifier) => void;
  onView: (modifier: Modifier) => void;
  index: number;
  modifier: Modifier;
  selected?: boolean;
};

type ModifierRowInnerProps = {
  itemsCount: number;
};

const ModifierRowInner: React.FC<ModifierRowOuterProps & ModifierRowInnerProps> = ({
  onSelect,
  index,
  itemsCount,
  modifier,
  onView,
  selected,
  ...props
}) => {
  return (
    <HStack flex={1} alignItems="center" justifyContent="space-between" onTouchEnd={() => onSelect(modifier)} {...props}>
      <VStack flex={1}>
        <Text style={{ alignSelf: 'flex-start' }}>{`${index + 1}: ${modifier.name}`}</Text>
        <Text style={{ alignSelf: 'flex-start' }} sub>{`Assigned: ${itemsCount} Items`}</Text>
      </VStack>
      <HStack w="80px" justifyContent="flex-end">
        <Button variant='outline' colorScheme='info' size='sm' onPress={() => onView(modifier)}>
          Edit
        </Button>
      </HStack>
    </HStack>
  );
};

const enhance = c =>
  withObservables<ModifierRowOuterProps, ModifierRowInnerProps>(['modifier'], ({ modifier }) => {
    return {
      modifier,
      itemsCount: modifier.itemModifiers.observeCount(),
    };
  })(c);

export const ModifierRow = enhance(ModifierRowInner);
