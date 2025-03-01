import withObservables from '@nozbe/with-observables';
import React from 'react';
import type { Modifier } from '../../../../models';
import { styles } from '../../../../styles';
import { HStack, Icon, ListItem, Text } from '../../../../core';

interface ModifierRowInnerProps {}

interface ModifierRowOuterProps {
  onSelect: (p: Modifier) => void;
  modifier: Modifier;
  isSelected?: boolean;
  isLeft?: boolean;
}

const ModifierRowInner: React.FC<ModifierRowOuterProps & ModifierRowInnerProps> = ({
  isLeft,
  isSelected,
  onSelect,
  modifier,
}) => {
  return isLeft ? (
    <ListItem key={modifier.id} noIndent style={isSelected && styles.selectedRow} onPress={() => onSelect(modifier)}>
      <HStack flex={1} alignItems="center" justifyContent="space-between">
        <HStack w="80px" justifyContent="flex-start">
          <Text>{modifier.name}</Text>
        </HStack>
        <HStack flex={1} />
        <HStack w="80px" justifyContent="flex-end">
          <Icon name="arrow-forward" size={24} color="grey"/>
        </HStack>
      </HStack>
    </ListItem>
  ) : (
    <ListItem key={modifier.id} noIndent style={isSelected && styles.selectedRow} onPress={() => onSelect(modifier)}>
      <HStack flex={1} alignItems="center" justifyContent="space-between">
        <HStack w="80px" justifyContent="flex-start">
          <Icon name="arrow-back" size={24} color="grey" />
        </HStack>
        <HStack flex={1} justifyContent="flex-start">
          <Text>{modifier.name}</Text>
        </HStack>
        <HStack w="80px" justifyContent="flex-end">
        </HStack>
      </HStack>
    </ListItem>
  );
};

const enhance = withObservables<ModifierRowOuterProps, ModifierRowInnerProps>(['modifier'], ({ modifier }) => ({
  modifier,
}));

export const ModifierRow = enhance(ModifierRowInner);
