import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Box, HStack, Input, FormControl } from '../../core';
import { moderateScale } from '../../utils/scaling';

const InputPasscode: React.FC<{ value: string; onChange: any }> = ({ value, onChange }) => {
  return (
    <Box style={styles.content}>
      <HStack style={styles.item}>
        <FormControl.Label>Enter passcode</FormControl.Label>
        <Input value={value} onChangeText={onChange} secureTextEntry />
      </HStack>
    </Box>
  );
};

type ProtectedProps = { code: string; navigation: any; isDisabled?: boolean };

export const Protected: React.FC<ProtectedProps> = ({ children, code, navigation, isDisabled }) => {
  const [passcode, setPasscode] = useState('');
  navigation.addListener('focus', () => setPasscode(''));

  return passcode === code || isDisabled ? children : <InputPasscode value={passcode} onChange={setPasscode} />;
};

const styles = StyleSheet.create({
  item: {
    width: moderateScale(300),
  },
  content: {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
