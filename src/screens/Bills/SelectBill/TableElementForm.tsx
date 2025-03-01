import { useDatabase } from '@nozbe/watermelondb/hooks';
import { Formik } from 'formik';
import { inRange } from 'lodash';
import React from 'react';
import * as Yup from 'yup';
import { ItemField } from '../../../components/ItemField/ItemField';
import { Button, FormControl, Icon, Input, Picker, HStack, Text, View } from '../../../core';
import type { TablePlanElement } from '../../../models';
import type {
  TablePlanElementProps} from '../../../models/TablePlanElement';
import {
  TablePlanElementRotations,
  TablePlanElementTypes,
} from '../../../models/TablePlanElement';
import { commonStyles } from '../../Settings/Tabs/styles';
import { tableNames } from '../../../models/tableNames';

type TableElementFormInnerProps = {};

type TableElementFormOuterProps = {
  tablePlanElement?: TablePlanElement;
  x: number;
  y: number;
  maxBills: number;
  onDelete: () => void;
};

const validationSchema = (maxBills: number) =>
  Yup.object().shape({
    billReference: Yup.string()
      .test('billReference', `Bill reference must be between 1 and ${maxBills}`, value => {
        if (!value || value.length === 0) {
          return true;
        }
        const ref = parseInt(value);
        if (inRange(ref, 0 + 1, maxBills + 1)) {
          return true;
        }
      })
      .nullable(),
    type: Yup.string().required(),
    rotation: Yup.string().required(),
  });

type FormValues = {
  billReference: string;
  type: string;
  rotation: string;
};

export const TableElementForm: React.FC<TableElementFormInnerProps & TableElementFormOuterProps> = ({
  tablePlanElement,
  x,
  y,
  maxBills,
  onDelete,
}) => {
  const database = useDatabase();

  const initialValues = tablePlanElement
    ? {
        billReference: tablePlanElement.billReference?.toString() || '',
        type: tablePlanElement.type,
        rotation: tablePlanElement.rotation.toString(),
      }
    : {
        billReference: null,
        type: '',
        rotation: '0',
      };

  const onSave = async (values: FormValues) => {
    const parsedValues: TablePlanElementProps = {
      billReference: parseInt(values.billReference) || null,
      type: values.type,
      posX: x,
      posY: y,
      rotation: parseInt(values.rotation),
    };
    
    if (tablePlanElement) {
      await tablePlanElement.updateElement(parsedValues);
    } else {
      await database.write(() => database.collections.get<TablePlanElement>(tableNames.tablePlanElements).create(record => Object.assign(record, parsedValues)));
    }
  };

  return (
    <Formik initialValues={initialValues} validationSchema={validationSchema(maxBills)} onSubmit={onSave}>
      {({ handleChange, handleBlur, handleSubmit, errors, touched, values }) => {
        const { billReference, rotation, type } = values;

        return (
          <View style={{ borderColor: 'lightgrey', borderLeftWidth: 1, height: '100%' }}>
            <HStack flex={1} justifyContent="flex-end" style={{ backgroundColor: 'whitesmoke', padding: 5 }}>
              <Button success small iconLeft onPress={handleSubmit}>
                <Icon name="add-circle-outline" size={24} color="white"/>
                <Text>Save</Text>
              </Button>
              {tablePlanElement && (
                <Button danger small onPress={onDelete} style={{ marginLeft: 5 }}>
                  <Icon name="trash" size={24} color="white"/>
                </Button>
              )}
            </HStack>
            <FormControl style={commonStyles.form}>
              <ItemField
                label="Table / Bill Number"
                touched={touched.billReference}
                name="billReference"
                errors={errors.billReference}
              >
                <Input
                  onChangeText={handleChange('billReference')}
                  onBlur={handleBlur('billReference')}
                  value={billReference}
                />
              </ItemField>

              <ItemField
                picker
                label="Type"
                touched={touched.type}
                name="type"
                errors={errors.type}
                style={{
                  alignItems: 'flex-start',
                }}
              >
                <Picker
                  mode="dropdown"
                  iosIcon={<Icon name="chevron-down-outline" color="white" size={24}/>}
                  placeholder="Select type"
                  selectedValue={type}
                  onValueChange={handleChange('type')}
                  textStyle={{
                    paddingLeft: 0,
                    paddingRight: 0,
                  }}
                >
                  {Object.keys(TablePlanElementTypes).map(type => (
                    <Picker.Item key={type} label={TablePlanElementTypes[type]} value={type} />
                  ))}
                </Picker>
              </ItemField>

              <ItemField
                picker
                label="Rotation"
                touched={touched.rotation}
                name="rotation"
                errors={errors.rotation}
                style={{
                  alignItems: 'flex-start',
                }}
              >
                <Picker
                  mode="dropdown"
                  iosIcon={<Icon name="chevron-down-outline" color="white" size={24}/>}
                  placeholder="Select rotation"
                  selectedValue={rotation}
                  onValueChange={handleChange('rotation')}
                  textStyle={{
                    paddingLeft: 0,
                    paddingRight: 0,
                  }}
                >
                  {Object.keys(TablePlanElementRotations).map(rotation => (
                    <Picker.Item key={rotation} label={rotation} value={TablePlanElementRotations[rotation]} />
                  ))}
                </Picker>
              </ItemField>
            </FormControl>
          </View>
        );
      }}
    </Formik>
  );
};

// export const enhance = withObservables<TableElementFormOuterProps, TableElementFormInnerProps>(
//   ['tablePlanElement'],
//   ({ tablePlanElement }) => ({
//     tablePlanElement: tablePlanElement ? tablePlanElement : {},
//   }),
// );
// export const TableElementForm = enhance(TableElementFormInner);
