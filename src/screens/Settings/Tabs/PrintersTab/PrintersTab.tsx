import type { Database } from '@nozbe/watermelondb';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import withObservables from '@nozbe/with-observables';
import { capitalize } from 'lodash';
import type React from 'react';
import { useEffect, useState } from 'react';
import { FlatList, ScrollView } from 'react-native';
// import { Printer as StarPrinterProps, Printers } from 'react-native-star-prnt';
import { Modal } from '../../../../components/Modal/Modal';
import { ConfirmationActionsheet } from '../../../../components/ConfirmationActionsheet/ConfirmationActionsheet';
import {
  Button,
  Container,
  Divider,
  HStack,
  Icon,
  Spinner,
  Text,
  VStack,
  View,
  useDisclose,
} from '../../../../core';
import type { Printer } from '../../../../models';
import type { PrinterProps } from '../../../../models/Printer';
import { ModalPrinterDetails } from './ModalPrinterDetails';
import { PrinterRow } from './PrinterRow';
import { tableNames } from '../../../../models/tableNames';
import type {
  StarPrinter,
  StarDeviceDiscoveryManager} from 'react-native-star-io10';
import {
  InterfaceType,
  StarConnectionSettings,
  StarXpandCommand,
  StarDeviceDiscoveryManagerFactory
} from 'react-native-star-io10';
interface PrintersTabOuterProps {
  database: Database;
}

interface PrintersTabInnerProps {
  printers: Printer[];
}

const PrintersTabInner: React.FC<PrintersTabOuterProps & PrintersTabInnerProps> = ({ printers, database }) => {
  const [selectedPrinter, setSelectedPrinter] = useState<Partial<Printer> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const onCancelHandler = () => {
    setSelectedPrinter(null);
  };

  const [lanIsEnabled, setLanIsEnabled] = useState(true);
  const [bluetoothIsEnabled, setBluetoothIsEnabled] = useState(false);
  const [bluetoothLeIsEnabled, setBluetoothLeIsEnabled] = useState(false);
  const [usbIsEnabled, setUsbIsEnabled] = useState(false);
  const [discoveredPrinters, setDiscoveredPrinters] = useState<StarPrinter[]>([]);
  const [manager, setManager] = useState<StarDeviceDiscoveryManager | undefined>(undefined);

  const { isOpen, onOpen, onClose } = useDisclose();
  const [printerToDelete, setPrinterToDelete] = useState<Printer | null>(null);

  useEffect( () => {
    const _startDiscovery = async () => {
        setDiscoveredPrinters([]);
        if (manager != undefined) {
            manager.discoveryTime = 10000;

            manager.onPrinterFound = async (printer: StarPrinter) => {
              setDiscoveredPrinters((printers) => [...printers, printer]);        
            };
    
            manager.onDiscoveryFinished = () => {
                setIsLoading(false);

            };

            try {
              setIsLoading(true);
                await manager.startDiscovery();

            }
            catch(error) {
                console.log(`Error: ${String(error)}`);
            }  
        }
    }
    _startDiscovery();
}, [manager]);

  const updatePrinter = async ({information, connectionSettings}: StarPrinter) => {
    const savedPrinter = printers.find(p => p.macAddress.replace(/:/g, '').toUpperCase() === information?._detail?._lan?._macAddress);
    if (!savedPrinter) {
      throw new Error('Saved printer to update not found');
    }

    if(!information || !connectionSettings) {
      throw new Error('Printer settings missing') 
    }

    await database.write(() =>
      savedPrinter.update(printerRecord => {
        printerRecord.macAddress = information._detail?._lan?._macAddress!;
        printerRecord.name = information.model!
        printerRecord.address = information._detail?._lan?._ipAddress!;
        printerRecord.emulation = information._emulation!
        printerRecord.identifier = connectionSettings.identifier
        printerRecord.interfaceType = connectionSettings.interfaceType
      }),
    );
  };

  const addPrinter = async ({information, connectionSettings}: StarPrinter) => {

    if(!information || !connectionSettings) {
      throw new Error('Printer creation details missing');
    }
    const selectedPrinterDetails = {
      macAddress: information._detail._lan._macAddress,
      name: information.model,
      address: information._detail._lan._ipAddress,
      emulation: information._emulation,
      identifier: connectionSettings.identifier,
      interfaceType: connectionSettings.interfaceType
    };
    setSelectedPrinter(selectedPrinterDetails);
  };

  const onSave = async (values: PrinterProps) => {
    setIsSaving(true);

    if (selectedPrinter && selectedPrinter.id) {
      await selectedPrinter?._update(values);
    } else {
      await database.write(async () => {
        const collection = database.collections.get<Printer>(tableNames.printers);
        await collection.create(record => {
          Object.assign(record, {
            macAddress: values.macAddress,
            name: values.name,
            address: values.address,
            printWidth: values.printWidth,
            emulation: values.emulation,
            receivesBillCalls: values.receivesBillCalls,
            identifier: values.identifier,
            interfaceType: values.interfaceType,
          });
        });
      });
    }
    setIsSaving(false);
    onCancelHandler();
  };

  const onDelete = async (printer: Printer) => {
    await printer.remove()
    onClose()
  };



  async function discoverPrinters() {
      try {
          await manager?.stopDiscovery()

          var interfaceTypes: Array<InterfaceType> = []
          if(lanIsEnabled) {
              interfaceTypes.push(InterfaceType.Lan);
          }
          if(bluetoothIsEnabled) {
              interfaceTypes.push(InterfaceType.Bluetooth);
          }
          if(bluetoothLeIsEnabled) {
              interfaceTypes.push(InterfaceType.BluetoothLE);
          }
          if(usbIsEnabled) {
              interfaceTypes.push(InterfaceType.Usb);
          }

          setManager(await StarDeviceDiscoveryManagerFactory.create(interfaceTypes));

      }
      catch(error) {
          console.log(`Error: ${String(error)}`);
      }
  }

  return (
    <Container>
      <VStack>
        <HStack flex={1} alignItems="center" justifyContent="space-between">
          <Text>Installed Printers</Text>
        </HStack>
        <Divider/>
        <ScrollView>
          {printers.map(p => (
            <PrinterRow
              key={p.id}
              isSelected={p === selectedPrinter}
              printer={p}
              onSelect={setSelectedPrinter}
              onDelete={() => {
                    setPrinterToDelete(p);
                    onOpen();
              }}
            />
          ))}
        </ScrollView>
      </VStack>

      <VStack>
        <HStack flex={1} alignItems="center" justifyContent="space-between">
          <Text>Discover Printers</Text>
          <HStack justifyContent="flex-end">
            <Button small disabled={isLoading} onPress={discoverPrinters}>
              <Text>Discover Printers</Text>
            </Button>
          </HStack>
        </HStack>
        <Divider/>
        { discoveredPrinters.length === 0 ? (
          <Text style={{ padding: 10 }}> No printers found</Text>
        ) : (
          <ScrollView>
            {discoveredPrinters.map(discoveredPrinter => {
              const isInstalled = printers.find(printer => printer.macAddress?.replace(/:/g, '').toUpperCase() === discoveredPrinter._information?._detail._lan._macAddress);

              return (
                <HStack flex={1} alignItems="center" justifyContent="space-between" key={discoveredPrinter.connectionSettings.identifier}>
                  <Text>{discoveredPrinter.information?._model}</Text>
                  <VStack flex={1} justifyContent="flex-end">
                    <Text note>{discoveredPrinter.connectionSettings.interfaceType}</Text>
                    <Text note>{discoveredPrinter.information?._detail?._lan?._ipAddress}</Text>
                    <Text note>{discoveredPrinter.information?._detail?._lan?._macAddress}</Text>
                  </VStack>
                  <VStack flex={1} justifyContent="flex-end">
                    {isInstalled ? (
                      <Button small onPress={() => updatePrinter(discoveredPrinter)}>
                        <Text>Update</Text>
                      </Button>
                    ) : (
                      <Button small onPress={() => addPrinter(discoveredPrinter)}>
                        <Text>Add</Text>
                      </Button>
                    )}
                  </VStack>
                </HStack>
              );
            })}
          </ScrollView>
        )}
        {isLoading && (
          <Spinner />
        )}
      </VStack>

      <Modal isOpen={!!selectedPrinter} onClose={onCancelHandler} style={{ maxWidth: 800 }}>
        <ModalPrinterDetails printer={selectedPrinter} onSave={onSave} onClose={onCancelHandler} isLoading={isSaving} />
      </Modal>

      {/* Delete Confirmation Actionsheet */}
      <ConfirmationActionsheet
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={() => printerToDelete && onDelete(printerToDelete)}
        message="This will permanently remove this printer and remove it from all printer groups you have defined. Are you sure?"
      />
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
