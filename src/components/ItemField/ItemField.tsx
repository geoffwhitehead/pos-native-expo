import React from 'react';
import { StyleSheet } from 'react-native';
import { FormControl, Stack } from '../../core';
import { paddingHelper } from '../../utils/helpers';
import { moderateScale } from '../../utils/scaling';
import { FormInputDescription } from '../FormInputDescription/FormInputDescription';
import { ErrorMessage } from 'formik';

type ItemFieldProps = {
  errors: any; // TODO
  touched: boolean;
  name: string;
  label: string;
  style?: Record<string, any>;
  disabled?: boolean;
  styleLabel?: Object;
  type?: 'fixedLabel' | 'stackedLabel';
  description?: string;
  children?: React.ReactNode;
};

export const ItemField: React.FC<ItemFieldProps> = ({
  errors,
  touched,
  name,
  label,
  children,
  type = 'stackedLabel',
  style = {},
  disabled = false,
  styleLabel = {},
  description,
}) => {
  const props = {
    [type]: true,
  };

  return (
    <>
      <Stack
        isDisabled={disabled}
        style={{ ...(description ? styles.itemField : styles.itemFieldNoDesc), ...style }}
        {...props}
        
      >
        <FormControl.Label style={styleLabel}>{label}</FormControl.Label>
        {description && (
          <FormInputDescription style={styles.text} description={description}>
            {description}
          </FormInputDescription>
        )}
        {children}
      </Stack>
      {touched && (errors?.length > 0 || errors) && <FormControl.ErrorMessage style={{ ...styles.error, ...style }} {...props}>
        <ErrorMessage name={name} />
      </FormControl.ErrorMessage>}
    </>
  );
};

const styles = StyleSheet.create({
  text: {
    ...paddingHelper(10, 0, 0, 0),
  },
  itemField: {
    alignItems: 'flex-start',
    minHeight: moderateScale(100),
  },
  itemFieldNoDesc: {
    alignItems: 'flex-start',
  },
  error: { paddingLeft: 15, paddingRight: 15, color: 'red' },
});
