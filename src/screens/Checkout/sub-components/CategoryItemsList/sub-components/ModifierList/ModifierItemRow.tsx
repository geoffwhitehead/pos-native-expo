import withObservables from '@nozbe/with-observables';
import { HStack, Text } from '../../../../../../core';
import React, { useContext } from 'react';
import { OrganizationContext } from '../../../../../../contexts/OrganizationContext';
import type { ModifierItem, ModifierItemPrice } from '../../../../../../models';
import { formatNumber } from '../../../../../../utils';

interface ModifierItemRowOuterProps {
  modifierItem: ModifierItem;
  onPress: (modifierItem: ModifierItem) => void;
  selected: boolean;
  modifierItemPrice: ModifierItemPrice;
  isDisabled: boolean;
}

interface ModifierItemRowInnerProps {}

const ModifierItemRowInner: React.FC<ModifierItemRowOuterProps & ModifierItemRowInnerProps> = ({
  selected,
  modifierItem,
  modifierItemPrice,
  isDisabled,
  onPress,
}) => {
  const {
    organization: { currency },
  } = useContext(OrganizationContext);

  const hasPriceSet = modifierItemPrice.price !== null;

  return (
    <HStack flex={1} alignItems="center" justifyContent="space-between" onTouchEnd={() => onPress(modifierItem)} isFocused={selected} isDisabled={isDisabled}>
      <HStack flex={1}>
        <Text>{modifierItem.name}</Text>
      </HStack>
      <HStack flex={1} justifyContent="flex-end">
        {hasPriceSet && <Text style={{ color: 'grey' }}>{formatNumber(modifierItemPrice.price, currency)}</Text>}
        {!hasPriceSet && <Text note>No price set</Text>}
      </HStack>
    </HStack>
  );
};

export const ModifierItemRow = withObservables<ModifierItemRowOuterProps, ModifierItemRowInnerProps>(
  ['modifierItem', 'modifierItemPrice'],
  ({ modifierItem, modifierItemPrice }) => ({
    modifierItemPrice,
    modifierItem,
  }),
)(ModifierItemRowInner);
