import withObservables from '@nozbe/with-observables';
import { HStack, Button, ListItem, Text, Icon } from '../../../../core';
import React from 'react';
import type { Printer } from '../../../../models';
import { commonStyles } from '../styles';

interface PrinterRowInnerProps {}

interface PrinterRowOuterProps {
  onSelect: (p: Printer) => void;
  onDelete: (p: Printer) => void;
  printer: Printer;
  isSelected?: boolean;
}

const PrinterRowInner: React.FC<PrinterRowOuterProps & PrinterRowInnerProps> = ({
  isSelected,
  onSelect,
  printer,
  onDelete,
}) => {
  return (
    <ListItem
      key={printer.id}
      onPress={() => onSelect(printer)}
      style={isSelected ? commonStyles.selectedRow : {}}
    >
      <HStack flex={1} alignItems="center" justifyContent="space-between">
        <HStack w="80px" justifyContent="flex-start">
          <Text>{printer.name}</Text>
        </HStack>
        <HStack flex={1} justifyContent="flex-start">
          <Text note>{'Lan'}</Text>
          <Text note>{printer.address}</Text>
          <Text note>{printer.macAddress}</Text>
        </HStack>
        <HStack w="40px" justifyContent="flex-end">
          <Button small transparent onPress={() => onDelete(printer)}>
            <Icon name="trash-outline" size={24} />
          </Button>
          <Button small transparent onPress={() => onSelect(printer)}>
            <Icon name="pencil-outline" size={24} />
          </Button>
        </HStack>
      </HStack>
    </ListItem>
  );
};

const enhance = withObservables<PrinterRowOuterProps, PrinterRowInnerProps>(['printer'], ({ printer }) => ({
  printer,
}));

export const PrinterRow = enhance(PrinterRowInner);
