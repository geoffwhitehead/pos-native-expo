import withObservables from '@nozbe/with-observables';

import React from 'react';
import type { Printer } from '../../../../models';
import { HStack, Text, Icon } from '../../../../core';

interface PrinterRowChoiceInnerProps {}

interface PrinterRowChoiceOuterProps {
  onSelect: (p: Printer) => void;
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
      <HStack flex={1} alignItems="center" justifyContent="space-between" key={printer.id} onTouchEnd={() => onSelect(printer)}>
        <HStack w="80px" justifyContent="flex-start">
          <Text>{printer.name}</Text>
        </HStack>
        <HStack flex={1} justifyContent="flex-start">
          <Text note>{printer.address}</Text>
        </HStack>
        <HStack w="40px" justifyContent="flex-end">
          <Icon name="arrow-forward" color="grey" size={24}/>
        </HStack>
      </HStack>
    );
  } else {
    return (
      <HStack flex={1} alignItems="center" justifyContent="space-between" key={printer.id} onTouchEnd={() => onSelect(printer)}>
        <HStack w="40px" justifyContent="flex-start">
          <Icon name="arrow-back" color="grey" size={24}/>
        </HStack>
        <HStack w="80px" justifyContent="flex-start">
          <Text>{printer.name}</Text>
        </HStack>
        <HStack flex={1} justifyContent="flex-start">
          <Text note>{printer.address}</Text>
        </HStack>
      </HStack>
    );
  }
};

const enhance = withObservables<PrinterRowChoiceOuterProps, PrinterRowChoiceInnerProps>(['printer'], ({ printer }) => ({
  printer,
}));

export const PrinterRowChoice = enhance(PrinterRowChoiceInner);
