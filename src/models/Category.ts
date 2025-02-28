import { Model, Query, Relation, tableSchema } from '@nozbe/watermelondb';
import { children, field, nochange, relation, writer } from '@nozbe/watermelondb/decorators';
import { PrintCategory } from '.';
import { Item } from './Item';
import { ASSOCIATION_TYPES } from './constants';
import { tableNames } from './tableNames';

export class Category extends Model {
  static table = tableNames.categories;
  static associations = {
    items: { type: ASSOCIATION_TYPES.HAS_MANY, foreignKey: 'category_id' },
    print_categories: { type: ASSOCIATION_TYPES.BELONGS_TO, key: 'print_category_id' },
  };

  @children(tableNames.items) items!: Query<Item>;
  @relation(tableNames.printCategories, 'print_category_id') printCategory!: Relation<PrintCategory>;

  @nochange @field('name') name!: string;
  @field('short_name') shortName!: string;
  @field('background_color') backgroundColor!: string;
  @field('text_color') textColor!: string;
  @field('position_index') positionIndex!: number;
  @field('print_category_id') printCategoryId?: string;

  @writer async updateCategory(values: Partial<Category>) {
    await this.update(record => {
      Object.assign(record, values);
    });
  }
  @writer async deleteCategory() {
    await this.markAsDeleted();
  }
}

export const categorySchema = tableSchema({
  name: tableNames.categories,
  columns: [
    { name: 'name', type: 'string' },
    { name: 'short_name', type: 'string' },
    { name: 'background_color', type: 'string' },
    { name: 'text_color', type: 'string' },
    { name: 'position_index', type: 'number' },
    { name: 'print_category_id', type: 'string', isOptional: true },
  ],
});
