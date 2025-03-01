import React from 'react';
import { StyleSheet } from 'react-native';
import { HStack, Text } from '../../../core';
import { fontSizes } from '../../../theme';

interface BillRowEmptyProps {
  onCreateSelectBill: (reference: string) => void;
  reference: string;
}

export const BillRowEmpty: React.FC<BillRowEmptyProps> = ({ onCreateSelectBill, reference }) => {
  return (
      <HStack flex={1} alignItems="flex-start" style={styles.closedBill} key={reference} onTouchEnd={() => onCreateSelectBill(reference)}>
        <Text style={styles.rowText}>{reference}</Text>
      </HStack>
  );
};

const styles = StyleSheet.create({
  closedBill: {
    borderLeftColor: 'red',
    borderLeftWidth: 8,
  },
  rowText: {
    fontSize: fontSizes[3],
  },
});
