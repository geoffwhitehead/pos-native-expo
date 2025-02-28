import { schemaMigrations, createTable, addColumns } from '@nozbe/watermelondb/Schema/migrations'
import { migration as addPrinterFieldsMigration} from './add-printer-fields'

export default schemaMigrations({
  migrations: [
  ],
})