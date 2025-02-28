import { useDatabase } from '@nozbe/watermelondb/hooks';
import withObservables from '@nozbe/with-observables';
import { Formik } from 'formik';
import { capitalize } from 'lodash';
import React, { useState } from 'react';
import * as Yup from 'yup';
import { ItemField } from '../../../../components/ItemField/ItemField';
import { ModalContentButton } from '../../../../components/Modal/ModalContentButton';
import { Form, Input, useDisclose } from '../../../../core';
import { ConfirmationActionsheet } from '../../../../components/ConfirmationActionsheet/ConfirmationActionsheet';
import type { Modifier } from '../../../../models';
import { commonStyles } from '../../../Settings/Tabs/styles';
import { tableNames } from '../../../../models/tableNames';

type ModalModifierDetailsOuterProps = {
  onClose: () => void;
  modifier?: Modifier;
};

type ModalModifierDetailsInnerProps = {
  itemsCount?: number;
};

const modifierSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Too Short')
    .max(50, 'Too Long')
    .required('Required'),
  minItems: Yup.number()
    .moreThan(-1)
    .required('This field is required.')
    .when(['maxItems'], (maxItems, schema) => {
      return schema.max(maxItems);
    }),
  maxItems: Yup.number()
    .moreThan(0)
    .required('This field is required.'),
});

type FormValues = {
  name: string;
  minItems: string;
  maxItems: string;
};

const ModalModifierDetailsInner: React.FC<ModalModifierDetailsOuterProps & ModalModifierDetailsInnerProps> = ({
  modifier,
  onClose,
  itemsCount,
}) => {
  const [loading, setLoading] = useState(false);
  const database = useDatabase();
  const { isOpen, onOpen, onClose: onCloseDelete } = useDisclose();

  const update = async (values: FormValues, modifier: Modifier) => {
    setLoading(true);
    const { name, minItems, maxItems } = values;

    if (modifier) {
      await modifier.updateItem({
        name,
        minItems: parseInt(minItems),
        maxItems: parseInt(maxItems),
      });
    } else {
      await database.write(() => database.collections.get<Modifier>(tableNames.modifiers).create(record => Object.assign(record, values)));
    }

    setLoading(false);
    onClose();
  };

  const onDelete = async () => {
    await database.write(() => modifier.remove());
    onClose();
    onCloseDelete();
  };

  const initialValues = {
    name: modifier?.name || '',
    minItems: modifier?.minItems.toString() || '0',
    maxItems: modifier?.maxItems.toString() || '0',
  };

  return (
    <>
      <Formik
        initialValues={initialValues}
        validationSchema={modifierSchema}
        onSubmit={values => update(values, modifier)}
      >
        {({ handleChange, handleBlur, handleSubmit, errors, touched, values }) => {
          const { name, minItems, maxItems } = values;

          const title = modifier ? `${capitalize(modifier.name)}` : 'New Modifier';

          return (
            <ModalContentButton
              primaryButtonText="Save"
              onPressPrimaryButton={handleSubmit}
              onPressSecondaryButton={onClose}
              secondaryButtonText="Cancel"
              title={title}
              isPrimaryDisabled={loading}
              isDeleteDisabled={itemsCount > 0}
              onPressDelete={onOpen}
              size="small"
            >
              <Form style={commonStyles.form}>
                <ItemField label="Name" touched={touched.name} name="name" errors={errors.name}>
                  <Input onChangeText={handleChange('name')} onBlur={handleBlur('name')} value={name} />
                </ItemField>
                <ItemField label="Min Items" touched={touched.minItems} name="minItems" errors={errors.minItems}>
                  <Input onChangeText={handleChange('minItems')} onBlur={handleBlur('minItems')} value={minItems} keyboardType="numeric" />
                </ItemField>
                <ItemField label="Max Items" touched={touched.maxItems} name="maxItems" errors={errors.maxItems}>
                  <Input onChangeText={handleChange('maxItems')} onBlur={handleBlur('maxItems')} value={maxItems} keyboardType="numeric" />
                </ItemField>
              </Form>
            </ModalContentButton>
          );
        }}
      </Formik>

      <ConfirmationActionsheet
        isOpen={isOpen}
        onClose={onCloseDelete}
        onConfirm={onDelete}
        message="Remove this modifier. Are you sure?"
        confirmText="Remove"
      />
    </>
  );
};

const enhance = c =>
  withObservables<ModalModifierDetailsOuterProps, ModalModifierDetailsInnerProps>(['modifier'], ({ modifier }) => {
    return {
      itemsCount: modifier.itemModifiers.observeCount(),
    };
  })(c);

export const ModalModifierDetails = enhance(ModalModifierDetailsInner);
