import { addColumns } from "@nozbe/watermelondb/Schema/migrations";
import { tableNames } from "../tableNames";

export const migration = {
    // ⚠️ Set this to a number one larger than the current schema version
    toVersion: 78,
    steps: [
      // See "Migrations API" for more details
      addColumns({
        table: tableNames.printers,
        columns: [
          { name: 'identifier', type: 'string',},
          { name: 'interface_type', type: 'string' },
        ],
      }),
    ],
  }