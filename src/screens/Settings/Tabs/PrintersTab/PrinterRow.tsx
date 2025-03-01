import withObservables from '@nozbe/with-observables';
import { HStack, Button, Text, Icon } from '../../../../core';
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
    <HStack flex={1} alignItems="center" justifyContent="space-between" key={printer.id} onTouchEnd={() => onSelect(printer)} style={isSelected ? commonStyles.selectedRow : {}}>
      <HStack w="80px" justifyContent="flex-start">
        <Text>{printer.name}</Text>
      </HStack>
      <HStack flex={1} justifyContent="flex-start">
        <Text sub>{'Lan'}</Text>
        <Text sub>{printer.address}</Text>
        <Text sub>{printer.macAddress}</Text>
      </HStack>
      <HStack w="40px" justifyContent="flex-end">
        <Button size="sm" variant="ghost" onPress={() => onDelete(printer)} leftIcon={<Icon name="trash-outline" size={24} />}/>
        <Button size="sm" variant="ghost" onPress={() => onSelect(printer)} leftIcon={<Icon name="pencil-outline" size={24} />}/>
      </HStack>
    </HStack>
  );
};

const enhance = withObservables<PrinterRowOuterProps, PrinterRowInnerProps>(['printer'], ({ printer }) => ({
  printer,
}));

export const PrinterRow = enhance(PrinterRowInner);
