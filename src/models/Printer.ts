import { Model, Query, tableSchema } from '@nozbe/watermelondb';
import { action, children, field, writer } from '@nozbe/watermelondb/decorators';
import { ASSOCIATION_TYPES } from './constants';
import type { PrinterGroupPrinter } from './PrinterGroupPrinter';

export enum Emulations {
  'StarPRNT' = 'StarPRNT',
  'StarLine' = 'StarLine',
  'StarGraphic' = 'StarGraphic',
  'StarDotImpact' = 'StarDotImpact',
  'EscPosMobile' = 'EscPosMobile',
  'EscPos' = 'EscPos',
}

export type PrinterProps = {
  name: string;
  address: string;
  macAddress: string;
  printWidth: number;
  emulation: Emulations;
  receivesBillCalls: boolean;
};

export class Printer extends Model {
  static table = 'printers';

  @field('name') name!: string;
  @field('address') address!: string;
  @field('mac_address') macAddress!: string;
  @field('print_width') printWidth!: number;
  @field('emulation') emulation!: Emulations;
  @field('receives_bill_calls') receivesBillCalls!: boolean;

  static associations = {
    printer_groups_printers: { type: ASSOCIATION_TYPES.HAS_MANY, foreignKey: 'printer_id' },
  };

  @children('printer_groups_printers') printerGroupsPrinters!: Query<PrinterGroupPrinter>;

  @writer async remove() {
    const printerGroupLinks = await this.printerGroupsPrinters.fetch();
    const printerGroupPrintersToDelete = printerGroupLinks.map(pGP => pGP.prepareMarkAsDeleted());
    const toDelete = [...printerGroupPrintersToDelete, this.prepareMarkAsDeleted()];
    await this.database.batch(...toDelete);
  };
}

export const printerSchema = tableSchema({
  name: 'printers',
  columns: [
    { name: 'name', type: 'string' },
    { name: 'address', type: 'string' },
    { name: 'mac_address', type: 'string' },
    { name: 'print_width', type: 'number' },
    { name: 'emulation', type: 'string' },
    { name: 'receives_bill_calls', type: 'boolean' },
  ],
});
