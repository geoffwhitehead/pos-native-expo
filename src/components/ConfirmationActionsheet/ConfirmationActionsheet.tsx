import React from 'react';
import { Actionsheet, Text } from '../../core';

interface ConfirmationActionsheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export const ConfirmationActionsheet: React.FC<ConfirmationActionsheetProps> = ({
  isOpen,
  onClose,
  onConfirm,
  message,
  confirmText = 'Yes',
  cancelText = 'Cancel',
}) => {
  return (
    <Actionsheet isOpen={isOpen} onClose={onClose}>
      <Actionsheet.Content>
        <Text px={4} py={2}>{message}</Text>
        <Actionsheet.Item onPress={onConfirm}>{confirmText}</Actionsheet.Item>
        <Actionsheet.Item onPress={onClose}>{cancelText}</Actionsheet.Item>
      </Actionsheet.Content>
    </Actionsheet>
  );
};
