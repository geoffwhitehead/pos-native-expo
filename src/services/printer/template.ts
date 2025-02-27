import dayjs from 'dayjs';
// import { StarPRNT } from 'react-native-star-prnt';
import type { Organization } from '../../models';
import { alignCenter, alignLeftRight, alignSpaceBetween, appendAddress, appendNewLine } from './helpers';
import { PrinterBuilder } from 'react-native-star-io10/src/StarXpandCommand/PrinterBuilder';
import { StarXpandCommand } from 'react-native-star-io10';
import { Command } from './receiptBill';

export const receiptTemplate = (printerBuilder: StarXpandCommand.PrinterBuilder, organization: Organization, printWidth: number, table?: string)  => {
  printerBuilder
    .styleInternationalCharacter(StarXpandCommand.Printer.InternationalCharacterType.UK)
    .styleCharacterSpace(0)
    .styleAlignment(StarXpandCommand.Printer.Alignment.Center)

  appendAddress(printerBuilder, organization, printWidth)

  printerBuilder
  .styleAlignment(StarXpandCommand.Printer.Alignment.Left)
  .actionPrintText(appendNewLine())
  .actionPrintText(appendNewLine('Table: ' + (table?.toString() ?? '')))
  .actionPrintText(appendNewLine('Date: ' + dayjs().format('DD/MM/YYYY') + ' ' + dayjs().format('HH:mm')))
  .actionPrintText(appendNewLine())

};
