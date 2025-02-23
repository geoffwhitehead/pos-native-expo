import withObservables from '@nozbe/with-observables';
import React from 'react';
import type { Modifier } from '../../../../models';
import { styles } from '../../../../styles';
import { Body, Icon, Left, ListItem, Right, Text } from '../../../../core';

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
      <Left>
        <Text>{modifier.name}</Text>
      </Left>
      <Body />
      <Right>
        <Icon name="arrow-forward" size={24} color="grey"/>
      </Right>
    </ListItem>
  ) : (
    <ListItem key={modifier.id} noIndent style={isSelected && styles.selectedRow} onPress={() => onSelect(modifier)}>
      <Left>
        <Icon name="arrow-back" size={24} color="grey" />
        <Text>{modifier.name}</Text>
      </Left>
      <Body />
      <Right />
    </ListItem>
  );
};

const enhance = withObservables<ModifierRowOuterProps, ModifierRowInnerProps>(['modifier'], ({ modifier }) => ({
  modifier,
}));

export const ModifierRow = enhance(ModifierRowInner);
