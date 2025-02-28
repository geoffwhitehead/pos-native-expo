import dayjs from 'dayjs';
import type { Organization } from '../../models';
import {  appendAddress, appendNewLine } from './helpers';
import { StarXpandCommand } from 'react-native-star-io10';

export const receiptTemplate = (printerBuilder: StarXpandCommand.PrinterBuilder, organization: Organization, printWidth: number, table?: string)  => {
  printerBuilder
    .styleInternationalCharacter(StarXpandCommand.Printer.InternationalCharacterType.UK)
    .styleCharacterSpace(0)
    .styleAlignment(StarXpandCommand.Printer.Alignment.Center)

  appendAddress(printerBuilder, organization, printWidth)

  printerBuilder
  .styleAlignment(StarXpandCommand.Printer.Alignment.Left)
  .actionPrintText(appendNewLine())
  .actionPrintText(table ? (appendNewLine('Table: ' + (table?.toString() ?? ''))) : '')
  .actionPrintText(appendNewLine('Date: ' + dayjs().format('DD/MM/YYYY') + ' ' + dayjs().format('HH:mm')))
  .actionPrintText(appendNewLine())

};
