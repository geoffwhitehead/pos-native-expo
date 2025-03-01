import withObservables from '@nozbe/with-observables';
import React from 'react';
import { NewButton, HStack, Text } from '../../../../core';
import type { Printer, PrinterGroup } from '../../../../models';
import { commonStyles } from '../styles';

interface PrinterGroupRowInnerProps {
  printers: Printer[];
}

interface PrinterGroupRowOuterProps {
  onSelect: (pG: PrinterGroup) => void;
  onDelete: (pG: PrinterGroup) => void;
  isSelected: boolean;
  printerGroup: PrinterGroup;
}

const PrinterGroupRowInner: React.FC<PrinterGroupRowOuterProps & PrinterGroupRowInnerProps> = ({
  isSelected,
  printers,
  onSelect,
  onDelete,
  printerGroup,
  ...props
}) => {
  return (
    <HStack flex={1} alignItems="center" justifyContent="space-between" style={isSelected ? commonStyles.selectedRow : {}} {...props}>
      <HStack flex={1} space={4}>
        <Text>{printerGroup.name}</Text>
        <Text sub>{printers.map(p => p.name).join(', ')}</Text>
      </HStack>
      <HStack w="120px" justifyContent="flex-end">
        <NewButton style={{ marginRight: 10 }} variant="outline" colorScheme="danger" size="sm" onPress={() => onDelete(printerGroup)}>
          Delete
        </NewButton>
        <NewButton variant="outline" colorScheme="info" size="sm" onPress={() => onSelect(printerGroup)}>
          Edit
        </NewButton>
      </HStack>
    </HStack>
  );
};

const enhance = withObservables<PrinterGroupRowOuterProps, PrinterGroupRowInnerProps>(
  ['printerGroup'],
  ({ printerGroup }) => ({
    printerGroup,
    printers: printerGroup.printers,
  }),
);

export const PrinterGroupRow = enhance(PrinterGroupRowInner);
