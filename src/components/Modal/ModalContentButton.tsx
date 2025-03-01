import React from 'react';
import { View } from 'react-native';
import { NewButton, Container, Icon, Text } from '../../core';
import { colors } from '../../theme';
import { resolveButtonState } from '../../utils/helpers';
import { moderateScale } from '../../utils/scaling';

enum ModalSizes {
  small = 500,
  medium = 800,
  large = 1000,
}

interface ModalContentButtonProps {
  title: string;
  onPressPrimaryButton: () => void;
  onPressSecondaryButton: () => void;
  primaryButtonText: string;
  secondaryButtonText: string;
  isPrimaryDisabled?: boolean;
  isSecondaryDisabled?: boolean;
  isDeleteDisabled?: boolean;
  onPressDelete?: () => void;
  style?: Record<string, any>;
  size?: 'small' | 'medium' | 'large';
}

export const ModalContentButton: React.FC<ModalContentButtonProps> = ({
  children,
  isPrimaryDisabled,
  isSecondaryDisabled,
  isDeleteDisabled,
  title,
  onPressPrimaryButton,
  onPressSecondaryButton,
  primaryButtonText,
  secondaryButtonText,
  onPressDelete,
  style,
  size,
  ...props
}) => {
  const width = size ? ModalSizes[size] : 'auto';

  return (
    <View {...props} style={{ ...styles.modal, ...style, width }}>
      <View style={styles.heading}>
        <Text style={{ color: 'white' }}>{title}</Text>
        <View style={styles.buttons}>
          <NewButton
            {...resolveButtonState(isSecondaryDisabled, 'light')}
            isDisabled={isSecondaryDisabled}
            onPress={onPressSecondaryButton}
          >
            {secondaryButtonText}
          </NewButton>
          <NewButton
            style={styles.buttonSpacingLeft}
            {...resolveButtonState(isPrimaryDisabled, 'success')}
            isDisabled={isPrimaryDisabled}
            onPress={onPressPrimaryButton}
          >
            {primaryButtonText}
          </NewButton>
          {onPressDelete && (
            <NewButton
              style={styles.buttonSpacingLeft}
              {...resolveButtonState(isDeleteDisabled, 'danger')}
              isDisabled={isDeleteDisabled}
              onPress={onPressDelete}
              leftIcon={<Icon name="trash" size={24} color="white"/>}
            >
              {secondaryButtonText}
            </NewButton>
          )}
        </View>
      </View>
      <Container style={styles.content}>{children}</Container>
    </View>
  );
};

const styles = {
  heading: {
    marginBottom: moderateScale(20),
    display: 'flex',
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(12),
    paddingLeft: moderateScale(20),
    paddingRight: moderateScale(20),
    backgroundColor: colors.darkBlue,
    borderBottom: 'grey',
    borderBottomWidth: 1,
    color: 'white',
  },
  content: {
    padding: moderateScale(30),
  },

  modal: {
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 5,
    shadowColor: '#000000',
    shadowOpacity: 0.8,
    shadowRadius: 2,
    shadowOffset: {
      height: 1,
      width: 2,
    },
  },
  buttons: {
    display: 'flex',
    justifyContent: 'flex-end',
    flexDirection: 'row',
  },
  buttonSpacingLeft: {
    marginLeft: moderateScale(10),
  },
} as const;
