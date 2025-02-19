import { appSchema, Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { models, schemas } from '../models'; // Adjust the path as necessary

const adapter = new SQLiteAdapter({
  schema: appSchema({
    version: 77,
    tables: Object.values(schemas),
  }),
});

export const database = new Database({
  adapter,
  modelClasses: Object.values(models),
});

export const resetDatabase = async () => {
  try {
    await database.action(async () => {
      await database.unsafeResetDatabase();
      return { success: true };
    });
  } catch (e) {
    return {
      success: false,
      error: e,
    };
  }
};
