import withObservables from '@nozbe/with-observables';
import React from 'react';
import { Button, HStack, ListItem, Text } from '../../../../core';
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
    <ListItem {...props} noIndent style={isSelected ? commonStyles.selectedRow : {}}>
      <HStack flex={1} alignItems="center" justifyContent="space-between">
        <HStack flex={1} space={4}>
          <Text>{printerGroup.name}</Text>
          <Text note>{printers.map(p => p.name).join(', ')}</Text>
        </HStack>
        <HStack w="120px" justifyContent="flex-end">
          <Button style={{ marginRight: 10 }} bordered danger small onPress={() => onDelete(printerGroup)}>
            <Text>Delete</Text>
          </Button>
          <Button bordered info small onPress={() => onSelect(printerGroup)}>
            <Text>Edit</Text>
          </Button>
        </HStack>
      </HStack>
    </ListItem>
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
