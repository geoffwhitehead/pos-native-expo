import React from 'react';
import { NewButton, Text, View } from '../../core';

export type HeaderButtonBarProps = {
  onPressPrimary: () => void;
  primaryText: string;
};
export const HeaderButtonBar: React.FC<HeaderButtonBarProps> = ({ onPressPrimary, primaryText }) => {
  return (
    <View
      style={{
        borderBottomColor: 'lightgrey',
        borderBottomWidth: 1,
        padding: 10,
        display: 'flex',
        justifyContent: 'flex-end',
        flexDirection: 'row',
      }}
    >
      <NewButton style={{ width: 'auto' }} size='sm' colorScheme='success' onPress={onPressPrimary}>
        <Text>{primaryText}</Text>
      </NewButton>
    </View>
  );
};
