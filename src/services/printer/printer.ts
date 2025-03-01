import type { PrinterBuilder } from 'react-native-star-io10/src/StarXpandCommand/PrinterBuilder';
import type { Printer } from '../../models';

import type {
  InterfaceType} from 'react-native-star-io10';
import {
  StarConnectionSettings,
  StarXpandCommand,
  StarPrinter
} from 'react-native-star-io10';
import { useToast } from 'native-base';

type PrintProps = { printerBuilder: PrinterBuilder; printer: Printer; openDrawer?: boolean; onFinished?: (success: boolean) => void };


export async function print({ printerBuilder, printer, openDrawer = false, onFinished }: PrintProps) {
  const toast = useToast();
  try {

    var connectionSettings = new StarConnectionSettings();
    connectionSettings.interfaceType = printer.interfaceType as InterfaceType;
    connectionSettings.identifier = printer.identifier;
  
    const starPrinter = new StarPrinter(connectionSettings);
    const commandBuilder = new StarXpandCommand.StarXpandCommandBuilder();
    const documentBuilder = new StarXpandCommand.DocumentBuilder()
  
    if(openDrawer) {
      documentBuilder.addDrawer(new StarXpandCommand.DrawerBuilder()
        .actionOpen(new StarXpandCommand.Drawer.OpenParameter())
      )
    }
  
    documentBuilder.addPrinter(printerBuilder
      .actionCut(StarXpandCommand.Printer.CutType.Partial) 
    );
  
    commandBuilder.addDocument(documentBuilder);

    const commands = await  commandBuilder.getCommands()
  
    await starPrinter.open();
    await starPrinter.print(commands);
    await starPrinter.close();
    await starPrinter.dispose();

    return { success: true };
  } catch (e) {


    toast.show({
          title: `Failed to print. Check paper has not ran out and printer is connected and try again. Error details: ${e}`,
          placement: 'bottom',
          variant: 'solid',
        });
        return { success: false, error: e }
  } finally {
    onFinished && onFinished(true)
  }
}
