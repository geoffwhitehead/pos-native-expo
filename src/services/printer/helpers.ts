import { PrinterBuilder } from 'react-native-star-io10/src/StarXpandCommand/PrinterBuilder';
import { StarXpandCommand } from 'react-native-star-io10';
import { Organization } from '../../models';

export const alignLeftRight = (left: string, right: string = '', receiptWidth: number, rightWidth = 12) => {
  const leftWidth = Math.max(receiptWidth - rightWidth, 0);
  const lines = Math.ceil(left.length / leftWidth);
  const spaces = Math.max(receiptWidth * lines - right.length - left.length, 0);
  return `${left}${' '.repeat(spaces)}${right}`;
};

export const alignLeftRightSingle = (left: string, right: string, width) => {
  const spaces = Math.max(width - left.length - right.length, 0);
  return `${left}${' '.repeat(spaces)}${right}`;
};

export const alignCenter = (string: string, receiptWidth: number) => {
  const leftSpaces = Math.max(Math.floor(receiptWidth / 2 - string.length / 2), 0);
  return `${' '.repeat(leftSpaces)}${string}`;
};

export const alignRight = (string: string, receiptWidth: number) => {
  const leftSpaces = Math.max(Math.floor(receiptWidth - string.length), 0);
  return `${' '.repeat(leftSpaces)}${string}`;
};

export const divider = (receiptWidth: number) => (appendNewLine('-'.repeat(receiptWidth)));
export const starDivider = (receiptWidth: number) => (appendNewLine('*'.repeat(receiptWidth)));
export const newLine = ' \n';

export const addHeader = (builder: PrinterBuilder, header: string, printWidth: number) => {
  builder.actionPrintText(appendNewLine(header))
  builder.actionPrintText(divider(printWidth))
};

export const subHeader = (header: string, receiptWidth: number, symbol: string = '-') => {
  const paddingLength = (receiptWidth - header.length) / 2;
  const leftPadding = symbol.repeat(Math.floor(paddingLength));
  const rightPadding = symbol.repeat(Math.ceil(paddingLength));
  return `${leftPadding}${header}${rightPadding}`;
};

export const appendNewLine = (c: string = '') => c + '\n';

export const alignSpaceBetween = (left: string, right: string, width:number, addNewLine: boolean = true) => {
  const spaces = Math.max(width - left.length - right.length, 0);
  return addNewLine ? appendNewLine(`${left}${' '.repeat(spaces)}${right}`) : `${left}${' '.repeat(spaces)}${right}`;
};

export const appendAddress = (builder: PrinterBuilder, organization: Organization, printWidth: number) => {
  builder.actionPrintText(appendNewLine(organization.name))
  .actionPrintText(appendNewLine(organization.addressLine1))
  .actionPrintText((organization.addressLine2 ? appendNewLine(organization.addressLine2) : ''))
  .actionPrintText(appendNewLine(organization.addressCity))
  .actionPrintText(appendNewLine(organization.addressCounty))
  .actionPrintText(appendNewLine(organization.addressPostcode))
}
export const formatSize = (builder: PrinterBuilder, text: string, size: number) => {
  builder.add(new StarXpandCommand.PrinterBuilder()
  .styleMagnification(new StarXpandCommand.MagnificationParameter(size, size))
  .actionPrintText(appendNewLine(text))
)
}