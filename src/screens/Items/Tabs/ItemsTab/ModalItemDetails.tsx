import { Database } from '@nozbe/watermelondb';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import withObservables from '@nozbe/with-observables';
import { FieldArray, Formik } from 'formik';
import { capitalize, keyBy } from 'lodash';
import React, { useContext, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import * as Yup from 'yup';
import { ItemField } from '../../../../components/ItemField/ItemField';
import { Loading } from '../../../../components/Loading/Loading';
import { ModalContentButton } from '../../../../components/Modal/ModalContentButton';
import { OrganizationContext } from '../../../../contexts/OrganizationContext';
import { ActionSheet, Col, Form, Grid, H3, Icon, Input, List, ListItem, Picker, Row, Text } from '../../../../core';
import {
  Category,
  Item as ItemModel,
  ItemModifier,
  ItemPrice,
  Modifier,
  PriceGroup,
  PrinterGroup,
  tableNames,
} from '../../../../models';
import { styles as commonStyles } from '../../../../styles';
import { ModifierRow } from './ModifierRow';
interface ItemDetailsOuterProps {
  item?: ItemModel;
  onClose: () => void;
  database: Database;
  category: Category;
}

interface ItemDetailsInnerProps {
  item?: ItemModel;
  categories: Category[];
  printerGroups: PrinterGroup[];
  itemPrices: ItemPrice[];
  modifiers: Modifier[];
  itemModifiers: Modifier[];
  priceGroups: PriceGroup[];
}

const generateItemSchema = (shortNameLength: number) =>
  Yup.object().shape({
    name: Yup.string()
      .min(2, 'Too Short')
      .max(50, 'Too Long')
      .required('Required'),
    shortName: Yup.string()
      .min(2, 'Too Short')
      .max(shortNameLength, 'Too Long'),
    categoryId: Yup.string()
      .min(2, 'Too Short')
      .max(50, 'Too Long')
      .required('Required'),
    printerGroupId: Yup.string()
      .min(2, 'Too Short')
      .max(50, 'Too Long'),
    prices: Yup.array().of(
      Yup.object().shape({
        priceGroup: Yup.object(),
        price: Yup.string(),
      }),
    ),
  });

const ItemDetailsInner: React.FC<ItemDetailsOuterProps & ItemDetailsInnerProps> = ({
  item,
  onClose,
  categories,
  printerGroups,
  itemPrices = [],
  priceGroups,
  modifiers = [],
  itemModifiers,
  database,
  category,
}) => {
  if (!priceGroups) {
    return <Loading />;
  }
  const [selectedModifiers, setSelectedModifiers] = useState<Modifier[]>([]);
  const [loading, setLoading] = useState(false);
  const { organization } = useContext(OrganizationContext);

  const itemSchema = generateItemSchema(organization.shortNameLength);
  const keyedItemPricesByPriceGroup = keyBy(itemPrices, itemPrice => itemPrice.priceGroupId);

  useEffect(() => {
    itemModifiers && setSelectedModifiers(itemModifiers);
  }, [itemModifiers]);

  const setAssignedModifiers = (modifier: Modifier) => {
    const alreadyAssigned = selectedModifiers.includes(modifier);

    if (alreadyAssigned) {
      setSelectedModifiers(selectedModifiers.filter(m => m !== modifier));
    } else {
      setSelectedModifiers([...selectedModifiers, modifier]);
    }
  };

  const areYouSure = (fn, item: ItemModel) => {
    const options = ['Remove', 'Cancel'];

    ActionSheet.show(
      {
        options,
        destructiveButtonIndex: 0,
        title: 'Remove this item. Are you sure?',
      },
      index => {
        index === 0 && fn(item);
      },
    );
  };

  const updateItem = async ({ prices, ...values }: FormValues) => {
    setLoading(true);

    if (item) {
      const reMappedPrices = prices.map(({ priceGroup, price }) => {
        const nullOrPrice = price === '' ? null : parseInt(price);

        return {
          itemPrice: keyedItemPricesByPriceGroup[priceGroup.id],
          price: nullOrPrice,
        };
      });
      await database.action(() => item.updateItem({ ...values, prices: reMappedPrices, selectedModifiers }));
      onClose();
    } else {
      const itemCollection = database.collections.get<ItemModel>(tableNames.items);
      const itemModifierCollection = database.collections.get<ItemModifier>(tableNames.itemModifiers);
      const itemPriceCollection = database.collections.get<ItemPrice>(tableNames.itemPrices);
      const itemToCreate = itemCollection.prepareCreate(newItem => {
        Object.assign(newItem, {
          name: values.name,
          shortName: values.shortName,
          categoryId: values.categoryId,
          printerGroupId: values.printerGroupId,
        });
      });

      const itemModifersToCreate = selectedModifiers.map(modifier =>
        itemModifierCollection.prepareCreate(newItemModifier => {
          newItemModifier.item.set(itemToCreate);
          newItemModifier.modifier.set(modifier);
        }),
      );

      const pricesToCreate = prices.map(({ price, priceGroup }) => {
        const nullOrPrice = price === '' ? null : parseInt(price);

        return itemPriceCollection.prepareCreate(record => {
          record.priceGroup.set(priceGroup);
          record.item.set(itemToCreate);
          Object.assign(record, {
            price: nullOrPrice,
          });
        });
      });

      const toCreate = [itemToCreate, ...itemModifersToCreate, ...pricesToCreate];
      await database.action(() => database.batch(...toCreate));
    }
    setLoading(false);
    onClose();
  };

  const handleDelete = async (item: ItemModel) => {
    await database.action(() => item.remove());
    onClose();
  };

  const initialValues = {
    name: item?.name || '',
    shortName: item?.shortName || '',
    categoryId: item?.categoryId || category?.id || '',
    printerGroupId: item?.printerGroupId || '',
    prices: priceGroups.map(priceGroup => {
      /**
       * the 2 null checks here cover 2 scenarios:
       * - the item price doesnt exist because this is the "create" modal.
       * - the price exists but has been set to null to prevent the item being selected for this price group.
       */
      const priceOrEmptyString = keyedItemPricesByPriceGroup[priceGroup.id]?.price?.toString() || '';
      return { priceGroup: priceGroup, price: priceOrEmptyString };
    }),
  };

  type FormValues = {
    name: string;
    shortName: string;
    categoryId: string;
    printerGroupId: string;
    prices: { priceGroup: PriceGroup; price: string }[];
  };

  return (
    <Formik initialValues={initialValues} validationSchema={itemSchema} onSubmit={values => updateItem(values)}>
      {({ handleChange, handleBlur, handleSubmit, errors, touched, values }) => {
        const { name, shortName, prices, categoryId, printerGroupId } = values;

        const title = item ? `${capitalize(item.name)}` : 'New Item';

        return (
          <ModalContentButton
            title={title}
            onPressPrimaryButton={handleSubmit}
            primaryButtonText="Save"
            isPrimaryDisabled={loading}
            onPressSecondaryButton={onClose}
            secondaryButtonText="Cancel"
            onPressDelete={() => areYouSure(handleDelete, item)}
            // size="medium"
          >
            <Grid>
              <Row>
                <Col style={styles.column}>
                  <ScrollView>
                    <Form>
                      <H3 style={styles.heading}>Details</H3>

                      <ItemField label="Name" touched={touched.name} name="name" errors={errors.name}>
                        <Input onChangeText={handleChange('name')} onBlur={handleBlur('name')} value={name} />
                      </ItemField>

                      <ItemField
                        label="Short Name"
                        touched={touched.shortName}
                        name="shortName"
                        errors={errors.shortName}
                        description="Used on printers where space is restricted"
                      >
                        <Input
                          onChangeText={handleChange('shortName')}
                          onBlur={handleBlur('shortName')}
                          value={shortName}
                        />
                      </ItemField>

                      <ItemField
                        picker
                        label="Category"
                        touched={touched.categoryId}
                        name="categoryId"
                        errors={errors.categoryId}
                        style={{
                          alignItems: 'flex-start',
                        }}
                      >
                        <Picker
                          mode="dropdown"
                          iosIcon={<Icon name="chevron-down-outline" />}
                          placeholder="Select category"
                          selectedValue={categoryId}
                          onValueChange={handleChange('categoryId')}
                          textStyle={{
                            paddingLeft: 0,
                            paddingRight: 0,
                          }}
                        >
                          {categories.map(({ id, name }) => (
                            <Picker.Item key={id} label={name} value={id} />
                          ))}
                        </Picker>
                      </ItemField>

                      <ItemField
                        picker
                        label="Printer Group"
                        touched={touched.printerGroupId}
                        name="printerGroupId"
                        errors={errors.printerGroupId}
                        style={{
                          alignItems: 'flex-start',
                        }}
                      >
                        <Picker
                          mode="dropdown"
                          iosIcon={<Icon name="chevron-down-outline" />}
                          placeholder="Select printer group"
                          selectedValue={printerGroupId}
                          onValueChange={handleChange('printerGroupId')}
                          textStyle={{
                            paddingLeft: 0,
                            paddingRight: 0,
                          }}
                        >
                          {[...printerGroups, { id: '', name: 'No Selection' }].map(({ id, name }) => (
                            <Picker.Item key={id} label={name} value={id} />
                          ))}
                        </Picker>
                      </ItemField>
                    </Form>
                  </ScrollView>
                </Col>
                <Col style={styles.column}>
                  <Form>
                    <H3 style={styles.heading}>Prices</H3>
                    <ScrollView>
                      <FieldArray
                        name="prices"
                        render={() => {
                          return priceGroups.map((priceGroup, index) => {
                            return (
                              <ItemField
                                key={priceGroup.id}
                                label={capitalize(priceGroup.name)}
                                touched={touched.prices && touched.prices[index]?.price}
                                name={`prices[${index}].price`}
                                errors={errors.prices && errors.prices[index]}
                              >
                                <Input
                                  onChangeText={handleChange(`prices[${index}].price`)}
                                  onBlur={handleBlur(`prices[${index}]`)}
                                  value={prices[index].price}
                                />
                              </ItemField>
                            );
                          });
                        }}
                      />
                    </ScrollView>
                  </Form>
                </Col>
                <Col style={{ ...styles.column, ...styles.modifierRow }}>
                  <H3 style={styles.heading}>Modifiers</H3>
                  <Row style={commonStyles.row}>
                    <Col>
                      <ListItem itemDivider>
                        <Text>Assigned</Text>
                      </ListItem>
                      <ScrollView>
                        <List>
                          {selectedModifiers.map(m => (
                            <ModifierRow isLeft key={m.id} modifier={m} onSelect={m => setAssignedModifiers(m)} />
                          ))}
                        </List>
                      </ScrollView>
                    </Col>
                    <Col>
                      <ListItem itemDivider>
                        <Text>Available</Text>
                      </ListItem>
                      <ScrollView>
                        <List>
                          {modifiers
                            .filter(m => !selectedModifiers.includes(m))
                            .map(m => (
                              <ModifierRow
                                key={m.id}
                                modifier={m}
                                onSelect={m => setSelectedModifiers([...selectedModifiers, m])}
                              />
                            ))}
                        </List>
                      </ScrollView>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Grid>
          </ModalContentButton>
        );
      }}
    </Formik>
  );
};

const styles = StyleSheet.create({
  column: { padding: 10 },
  heading: { paddingBottom: 20 },
  modifierRow: { flexGrow: 2 },
});

const enhance = c =>
  withDatabase<any>(
    withObservables<ItemDetailsOuterProps, ItemDetailsInnerProps>(['item'], ({ item, database }) => {
      if (item) {
        return {
          item,
          printerGroups: database.collections.get<PrinterGroup>(tableNames.printerGroups).query(),
          itemPrices: item.prices,
          itemModifiers: item.modifiers,
          modifiers: database.collections.get<Modifier>(tableNames.modifiers).query(),
          priceGroups: database.collections.get<PriceGroup>(tableNames.priceGroups).query(),
          categories: database.collections.get<Category>(tableNames.categories).query(),
        };
      } else {
        return {
          printerGroups: database.collections.get<PrinterGroup>(tableNames.printerGroups).query(),
          modifiers: database.collections.get<Modifier>(tableNames.modifiers).query(),
          priceGroups: database.collections.get<PriceGroup>(tableNames.priceGroups).query(),
          categories: database.collections.get<Category>(tableNames.categories).query(),
        };
      }
    })(c),
  );

export const ItemDetails = enhance(ItemDetailsInner);
