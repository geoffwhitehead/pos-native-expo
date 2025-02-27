import withObservables from '@nozbe/with-observables';
import { Body, Button, Left, ListItem, Text } from 'native-base';
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
    <ListItem key={printer.id} noIndent style={isSelected ? commonStyles.selectedRow : {}}>
      <Left>
        <Text>{printer.name}</Text>
      </Left>
      <Body>
        <Text note>{'Lan'}</Text>
        <Text note>{printer.address}</Text>
        <Text note>{printer.macAddress}</Text>
      </Body>
      <Button style={{ marginRight: 10 }} bordered danger small onPress={() => onDelete(printer)}>
        <Text>Delete</Text>
      </Button>
      <Button bordered info small onPress={() => onSelect(printer)}>
        <Text>Edit</Text>
      </Button>
    </ListItem>
  );
};

const enhance = withObservables<PrinterRowOuterProps, PrinterRowInnerProps>(['printer'], ({ printer }) => ({
  printer,
}));

export const PrinterRow = enhance(PrinterRowInner);
