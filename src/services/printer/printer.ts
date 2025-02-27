import { PrinterBuilder } from 'react-native-star-io10/src/StarXpandCommand/PrinterBuilder';
import type { Printer } from '../../models';
import { toast } from '../../utils/toast';

import {
  InterfaceType,
  StarConnectionSettings,
  StarXpandCommand,
  StarPrinter
} from 'react-native-star-io10';

export async function portDiscovery(): Promise<any> {
  // try {
  //   let printers = await StarPRNT.portDiscovery('All');
  //   return printers;
  // } catch (e) {
  //   console.error(e);
  //   toast({
  //     message: `Failed to discover printers. ${e}`,
  //   });
  // }
}

type PrintProps = { printerBuilder: PrinterBuilder; printer: Printer; openDrawer?: boolean; onFinished?: (success: boolean) => void };


export async function print({ printerBuilder, printer, openDrawer = false, onFinished }: PrintProps) {

  console.log('printing ')
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
    toast({
          message: `Failed to print. ${e}`,
        });
        return { success: false, error: e }
  } finally {
    onFinished && onFinished(true)
  }
}
