import { Database } from '@nozbe/watermelondb';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import withObservables from '@nozbe/with-observables';
import { Formik } from 'formik';
import { capitalize } from 'lodash';
import React, { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import * as Yup from 'yup';
import { ItemField } from '../../../../components/ItemField/ItemField';
import { Loading } from '../../../../components/Loading/Loading';
import { ModalContentButton } from '../../../../components/Modal/ModalContentButton';
import { Col, Form, Input, List, ListItem, Row, Text } from '../../../../core';
import { PrinterGroup, PrinterGroupPrinter, tableNames } from '../../../../models';
import { Printer } from '../../../../models/Printer';
import { PrinterRowChoice } from '../PrintersTab/PrinterRowChoice';
import { commonStyles } from '../styles';

interface ModalPrinterGroupDetailsOuterProps {
  onClose: () => void;
  printerGroup?: PrinterGroup;
  database: Database;
}

interface ModalPrinterGroupDetailsInnerProps {
  printers: Printer[];
  assignedPrinters?: Printer[];
}

const printerGroupDetailsSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Too Short')
    .max(50, 'Too Long')
    .required('Required'),
});

type FormValues = {
  name: string;
};

const ModalPrinterGroupDetailsInner: React.FC<ModalPrinterGroupDetailsOuterProps &
  ModalPrinterGroupDetailsInnerProps> = ({ printerGroup, onClose, assignedPrinters, printers, database }) => {
  const [loading, setLoading] = useState(false);
  const [selectedPrinters, setSelectedPrinters] = useState<Printer[]>([]);

  const update = async (values: FormValues, printerGroup: PrinterGroup) => {
    setLoading(true);
    if (printerGroup) {
      await printerGroup.updateGroup({ ...values, printers: selectedPrinters });
    } else {
      const printerGroupRefsCollection = database.collections.get<PrinterGroupPrinter>(
        tableNames.printerGroupsPrinters,
      );
      const printerGroupCollection = database.collections.get<PrinterGroup>(tableNames.printerGroups);

      const pGToCreate = printerGroupCollection.prepareCreate(printerGroupRecord => {
        printerGroupRecord.name = values.name;
      });

      const pGRefsToCreate = selectedPrinters.map(printer =>
        printerGroupRefsCollection.prepareCreate(refRecord => {
          refRecord.printerGroup.set(pGToCreate);
          refRecord.printer.set(printer);
        }),
      );

      const toCreate = [pGToCreate, ...pGRefsToCreate];

      await database.action(() => database.batch(...toCreate));
    }
    setLoading(false);
    onClose();
  };

  const initialValues = {
    name: printerGroup?.name || '',
  };

  if (!printers || (printerGroup && !assignedPrinters)) {
    return <Loading />;
  }

  useEffect(() => {
    assignedPrinters && setSelectedPrinters(assignedPrinters);
  }, [assignedPrinters]);

  const togglePrinter = (printer: Printer) => {
    const alreadyAssigned = selectedPrinters.includes(printer);
    if (alreadyAssigned) {
      setSelectedPrinters(selectedPrinters.filter(sP => sP !== printer));
    } else {
      setSelectedPrinters([...selectedPrinters, printer]);
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={printerGroupDetailsSchema}
      onSubmit={values => update(values, printerGroup)}
    >
      {({ handleChange, handleBlur, handleSubmit, errors, touched, values }) => {
        const { name } = values;

        const title = printerGroup ? `${capitalize(printerGroup.name)}` : 'New Printer Group';

        return (
          <ModalContentButton
            primaryButtonText="Save"
            onPressPrimaryButton={handleSubmit}
            onPressSecondaryButton={onClose}
            secondaryButtonText="Cancel"
            title={title}
            isPrimaryDisabled={loading}
            size="medium"
          >
            <ScrollView>
              <Row>
                <Col>
                  <Form style={commonStyles.form}>
                    <ItemField label="Name" touched={touched.name} name="name" errors={errors.name}>
                      <Input onChangeText={handleChange('name')} onBlur={handleBlur('name')} value={name} />
                    </ItemField>
                  </Form>
                </Col>
              </Row>
              <Row>
                <Col style={s.pl}>
                  <List>
                    <ListItem itemDivider>
                      <Text>Assigned</Text>
                    </ListItem>
                    {selectedPrinters.map(p => (
                      <PrinterRowChoice arrowDir="right" printer={p} onSelect={() => togglePrinter(p)} />
                    ))}
                  </List>
                </Col>
                <Col style={s.pr}>
                  <List>
                    <ListItem itemDivider>
                      <Text>Available</Text>
                    </ListItem>
                    {printers
                      .filter(p => !selectedPrinters.includes(p))
                      .map(p => (
                        <PrinterRowChoice arrowDir="left" printer={p} onSelect={() => togglePrinter(p)} />
                      ))}
                  </List>
                </Col>
              </Row>
            </ScrollView>
          </ModalContentButton>
        );
      }}
    </Formik>
  );
};

const enhance = c =>
  withDatabase(
    withObservables<ModalPrinterGroupDetailsOuterProps, ModalPrinterGroupDetailsInnerProps>(
      ['printerGroup'],
      ({ printerGroup, database }) => {
        if (printerGroup) {
          return {
            printerGroup,
            printers: database.collections.get<Printer>(tableNames.printers).query(),
            assignedPrinters: printerGroup.printers,
          };
        }
        return {
          printers: database.collections.get<Printer>(tableNames.printers).query(),
        };
      },
    )(c),
  );

export const ModalPrinterGroupDetails = enhance(ModalPrinterGroupDetailsInner);

const s = {
  pl: {
    margin: 5,
    marginRight: 0,
    // borderColor: 'lightgrey',
    // borderWidth: 1,
    // borderRadius: 2,
    // borderRight: 'none'
  },
  pr: {
    margin: 5,
    // borderColor: 'lightgrey',
    // borderWidth: 1,
    // borderRadius: 2,
    // marginLeft: 0,
    // borderLeft: 'none'
  },
};
