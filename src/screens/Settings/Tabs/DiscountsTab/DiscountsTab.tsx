import type { Database } from '@nozbe/watermelondb';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import withObservables from '@nozbe/with-observables';
import React, { useContext, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { ConfirmationActionsheet } from '../../../../components/ConfirmationActionsheet/ConfirmationActionsheet';
import { Modal } from '../../../../components/Modal/Modal';
import { OrganizationContext } from '../../../../contexts/OrganizationContext';
import { Button, HStack, Icon, Spinner, Text, useDisclose, VStack } from '../../../../core';
import type { Discount } from '../../../../models';
import { formatNumber } from '../../../../utils';
import { resolveButtonState } from '../../../../utils/helpers';
import { commonStyles } from '../styles';
import { ModalDiscountDetails } from './ModalDiscountDetails';
import { tableNames } from '../../../../models/tableNames';

interface DiscountTabOuterProps {
  database: Database;
}

interface DiscountTabInnerProps {
  discounts: Discount[];
}

const DiscountTabInner: React.FC<DiscountTabOuterProps & DiscountTabInnerProps> = ({ database, discounts }) => {
  const { organization } = useContext(OrganizationContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<Discount>();
  const { isOpen, onOpen, onClose } = useDisclose();
  const [discountToDelete, setDiscountToDelete] = useState<Discount | null>(null);

  const onDelete = async (discount: Discount) => {
    await database.write(() => discount.markAsDeleted());
    onClose();
  };

  const onCancelHandler = () => {
    setSelectedDiscount(null);
    setIsModalOpen(false);
  };



  if (!discounts) {
    return <Spinner />;
  }

  const isCreateDisabled = discounts.length >= organization.maxDiscounts;

  return (
    <View>
      <List>
        <ListItem itemDivider>
          <HStack flex={1} alignItems="center" justifyContent="space-between">
            <Text>Discount</Text>
            <HStack justifyContent="flex-end">
              <Button
                {...resolveButtonState(isCreateDisabled, 'success')}
                iconLeft
                small
                onPress={() => setIsModalOpen(true)}
              >
                <Icon name="add-circle-outline" size={24} color="white"/>
                <Text>Create</Text>
              </Button>
            </HStack>
          </HStack>
        </ListItem>
        <ScrollView>
          {discounts.map(discount => {
            const amountString = discount.isPercent
              ? `${discount.amount}%`
              : formatNumber(discount.amount, organization.currency);

            return (
              <ListItem 
                key={discount.id} 
                onPress={() => setSelectedDiscount(discount)}
              >
                <HStack flex={1} alignItems="center" justifyContent="space-between">
                  <HStack flex={1} style={selectedDiscount === discount ? commonStyles.selectedRow : {}}>
                    <VStack>
                      <Text>{discount.name}</Text>
                      <Text note>
                        {amountString}
                      </Text>
                    </VStack>
                  </HStack>
                  <HStack justifyContent="flex-end">
                    <Button
                      style={{ marginRight: 10 }}
                      bordered
                      danger
                      small
                      disabled={discounts.length === 1}
                      onPress={() => {
                        setDiscountToDelete(discount);
                        onOpen();
                      }}
                    >
                      <Text>Delete</Text>
                    </Button>
                  </HStack>
                </HStack>
              </ListItem>
            );
          })}
          {isCreateDisabled && <Text>Max discounts reached</Text>}
        </ScrollView>
      </List>
      <Modal isOpen={isModalOpen} onClose={onCancelHandler} style={{ maxWidth: 600 }}>
        <ModalDiscountDetails discount={selectedDiscount} onClose={onCancelHandler} />
      </Modal>

      <ConfirmationActionsheet
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={() => discountToDelete && onDelete(discountToDelete)}
        message="Are you sure?"
      />
    </View>
  );
};

const enhance = c =>
  withDatabase<any>(
    withObservables<DiscountTabOuterProps, DiscountTabInnerProps>([], ({ database }) => ({
      discounts: database.collections.get<Discount>(tableNames.discounts).query(),
    }))(c),
  );

export const DiscountsTab = enhance(DiscountTabInner);

const styles = StyleSheet.create({
  rowText: { flexDirection: 'column' },
  text: { alignSelf: 'flex-start' },
} as const);
