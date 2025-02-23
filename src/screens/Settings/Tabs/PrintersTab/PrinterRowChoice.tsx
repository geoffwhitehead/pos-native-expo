import withObservables from '@nozbe/with-observables';

import React from 'react';
import type { Printer } from '../../../../models';
import { Left, ListItem, Text, Body, Right, Icon } from '../../../../core';

interface PrinterRowChoiceInnerProps {}

interface PrinterRowChoiceOuterProps {
  onSelect?: (p: Printer) => void;
  printer: Printer;
  arrowDir: 'left' | 'right';
}

const PrinterRowChoiceInner: React.FC<PrinterRowChoiceOuterProps & PrinterRowChoiceInnerProps> = ({
  onSelect,
  printer,
  arrowDir,
}) => {
  if (arrowDir === 'right') {
    return (
      <ListItem key={printer.id} noIndent onPress={() => onSelect(printer)}>
        <Left>
          <Text>{printer.name}</Text>
        </Left>
        <Body>
          <Text note>{printer.address}</Text>
        </Body>
        <Right>
          <Icon name="arrow-forward" color="grey" size={24}/>
        </Right>
      </ListItem>
    );
  } else {
    return (
      <ListItem key={printer.id} noIndent onPress={() => onSelect(printer)}>
        <Left>
          <Icon name="arrow-back" color="grey" size={24}/>
          <Text>{printer.name}</Text>
        </Left>
        <Body>
          <Text note>{printer.address}</Text>
        </Body>
        <Right></Right>
      </ListItem>
    );
  }
};

const enhance = withObservables<PrinterRowChoiceOuterProps, PrinterRowChoiceInnerProps>(['printer'], ({ printer }) => ({
  printer,
}));

export const PrinterRowChoice = enhance(PrinterRowChoiceInner);
