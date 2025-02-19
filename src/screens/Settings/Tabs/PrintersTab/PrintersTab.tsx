import { Database } from '@nozbe/watermelondb';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import withObservables from '@nozbe/with-observables';
import { capitalize } from 'lodash';
import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { Printer as StarPrinterProps, Printers } from 'react-native-star-prnt';
import { Modal } from '../../../../components/Modal/Modal';
import {
  ActionSheet,
  Body,
  Button,
  Container,
  Icon,
  Left,
  List,
  ListItem,
  Right,
  Spinner,
  Text,
} from '../../../../core';
import { Printer, tableNames } from '../../../../models';
import { Emulations, PrinterProps } from '../../../../models/Printer';
import { portDiscovery } from '../../../../services/printer/printer';
import { ModalPrinterDetails } from './ModalPrinterDetails';
import { PrinterRow } from './PrinterRow';

interface PrintersTabOuterProps {
  database: Database;
}

interface PrintersTabInnerProps {
  printers: Printer[];
}

const PrintersTabInner: React.FC<PrintersTabOuterProps & PrintersTabInnerProps> = ({ printers, database }) => {
  const [selectedPrinter, setSelectedPrinter] = useState<Partial<Printer>>();
  const [discoveredPrinters, setDiscoveredPrinters] = useState<Printers>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const onCancelHandler = () => {
    setSelectedPrinter(null);
  };

  const updatePrinter = async ({ macAddress, modelName, portName }: StarPrinterProps) => {
    const savedPrinter = printers.find(p => p.macAddress === macAddress);
    await database.action(() =>
      savedPrinter.update(printerRecord => {
        printerRecord.macAddress = macAddress;
        printerRecord.name = modelName;
        printerRecord.address = portName;
      }),
    );
  };

  const addPrinter = async (printer: StarPrinterProps) => {
    const { macAddress, modelName, portName } = printer;
    const selectedPrinterDetails = {
      macAddress: macAddress,
      name: modelName,
      address: portName,
    };
    setSelectedPrinter(selectedPrinterDetails);
  };

  const onSave = async (values: PrinterProps) => {
    setIsSaving(true);

    if (selectedPrinter.id) {
      await database.action(() =>
        selectedPrinter.update(record => {
          record.macAddress = values.macAddress;
          record.name = values.name;
          record.address = values.address;
          record.printWidth = parseInt(values.printWidth);
          record.emulation = Emulations[values.emulation];
          record.receivesBillCalls = values.receivesBillCalls;
        }),
      );
    } else {
      await database.action(async () => {
        const collection = database.collections.get<Printer>(tableNames.printers);
        await collection.create(record => {
          Object.assign(record, {
            macAddress: values.macAddress,
            name: values.name,
            address: values.address,
            printWidth: parseInt(values.printWidth),
            emulation: Emulations[values.emulation],
            receivesBillCalls: values.receivesBillCalls,
          });
        });
      });
    }
    setIsSaving(false);
    onCancelHandler();
  };

  const onDelete = async (printer: Printer) => {
    await database.action(printer.remove);
  };

  const areYouSure = (fn, p: Printer) => {
    const options = ['Yes', 'Cancel'];
    ActionSheet.show(
      {
        options,
        title:
          'This will permanently remove this printer and remove it from all printer groups you have defined. Are you sure?',
      },
      index => {
        index === 0 && fn(p);
      },
    );
  };

  const discoverPrinters = async () => {
    setIsLoading(true);
    const printers = await portDiscovery();
    if (printers) {
      setDiscoveredPrinters(printers);
    }
    setIsLoading(false);
  };

  return (
    <Container>
      <List>
        <ListItem itemDivider>
          <Left>
            <Text>Installed Printers</Text>
          </Left>
          <Right>
            <Button iconLeft success small onPress={() => addPrinter({})}>
              <Icon name="ios-add-circle-outline" />
              <Text>Add</Text>
            </Button>
          </Right>
        </ListItem>
        <ScrollView>
          {printers.map(p => (
            <PrinterRow
              key={p.id}
              isSelected={p === selectedPrinter}
              printer={p}
              onSelect={setSelectedPrinter}
              onDelete={() => areYouSure(onDelete, p)}
            />
          ))}
        </ScrollView>
      </List>

      <List>
        <ListItem itemDivider>
          <Left>
            <Text>Discover Printers</Text>
          </Left>
          <Right>
            <Button small disabled={isLoading} onPress={() => discoverPrinters()}>
              <Text>Discover Printers</Text>
            </Button>
          </Right>
        </ListItem>
        {isLoading ? (
          <Spinner />
        ) : discoveredPrinters.length === 0 ? (
          <Text style={{ padding: 10 }}> No printers found</Text>
        ) : (
          <ScrollView>
            {discoveredPrinters.map(discoveredPrinter => {
              const isInstalled = printers.find(printer => printer.macAddress === discoveredPrinter.macAddress);

              return (
                <ListItem key={discoveredPrinter.macAddress}>
                  <Left>
                    <Text>{discoveredPrinter.modelName}</Text>
                  </Left>
                  <Body>
                    <Text note>{capitalize(discoveredPrinter.portName)}</Text>
                    <Text note>{discoveredPrinter.macAddress}</Text>
                  </Body>
                  <Right>
                    {isInstalled ? (
                      <Button small onPress={() => updatePrinter(discoveredPrinter)}>
                        <Text>Update</Text>
                      </Button>
                    ) : (
                      <Button small onPress={() => addPrinter(discoveredPrinter)}>
                        <Text>Add</Text>
                      </Button>
                    )}
                  </Right>
                </ListItem>
              );
            })}
          </ScrollView>
        )}
      </List>

      <Modal isOpen={!!selectedPrinter} onClose={onCancelHandler} style={{ maxWidth: 800 }}>
        <ModalPrinterDetails printer={selectedPrinter} onSave={onSave} onClose={onCancelHandler} isLoading={isSaving} />
      </Modal>
    </Container>
  );
};

const enhance = c =>
  withDatabase<any>(
    withObservables<PrintersTabOuterProps, PrintersTabInnerProps>([], ({ database }) => ({
      printers: database.collections.get<Printer>(tableNames.printers).query(),
    }))(c),
  );

export const PrintersTab = enhance(PrintersTabInner);
