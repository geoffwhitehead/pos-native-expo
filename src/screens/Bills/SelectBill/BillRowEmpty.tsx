import React from 'react';
import { StyleSheet } from 'react-native';
import { HStack, ListItem, Text } from '../../../core';
import { fontSizes } from '../../../theme';

interface BillRowEmptyProps {
  onCreateSelectBill: (reference: string) => void;
  reference: string;
}

export const BillRowEmpty: React.FC<BillRowEmptyProps> = ({ onCreateSelectBill, reference }) => {
  return (
    <ListItem noIndent style={styles.closedBill} key={reference} onPress={() => onCreateSelectBill(reference)}>
      <HStack flex={1} alignItems="flex-start">
        <Text style={styles.rowText}>{reference}</Text>
      </HStack>
    </ListItem>
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
