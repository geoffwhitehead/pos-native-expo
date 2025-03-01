import withObservables from '@nozbe/with-observables';
import React, { useState } from 'react';
import { Modal } from '../../../../components/Modal/Modal';
import { Button, HStack, Icon, Text } from '../../../../core';
import type { Modifier, ModifierItem } from '../../../../models';
import { ModalModifierItemDetails } from './ModalModifierItemDetails';

type ModifierItemsOuterProps = {
  modifier: Modifier;
};

type ModifierItemsInnerProps = {
  modifierItems: ModifierItem[];
};

const ModifierItemsInner: React.FC<ModifierItemsOuterProps & ModifierItemsInnerProps> = ({
  modifierItems,
  modifier,
  ...props
}) => {
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedModifierItem, setSelectedModifierItem] = useState<ModifierItem>();

  const onSelect = async (modifierItem: ModifierItem) => {
    setSelectedModifierItem(modifierItem);
  };

  const onView = async (modifierItem: ModifierItem) => {
    setModalOpen(true);
    setSelectedModifierItem(modifierItem);
  };

  const onCloseHandler = () => {
    setModalOpen(false);
    setSelectedModifierItem(null);
  };

  const handleAdd = () => {
    setModalOpen(true);
    setSelectedModifierItem(null);
  };

  return (
    <>
      {modifierItems.length === 0 && (
        <Text>This modifier has no items assigned to it. Create some by pressing the button below.</Text>
      )}
      {modifierItems.map((modifierItem, index) => {
        return (
          <HStack flex={1} alignItems="center" justifyContent="space-between" key={modifierItem.id} {...props} onTouchEnd={() => onSelect(modifierItem)}>
            <Text>{`${index + 1}: ${modifierItem.name}`}</Text>
            <HStack w="80px" justifyContent="flex-end">
              <Button bordered info small onPress={() => onView(modifierItem)} transparent>
                <Text>Edit</Text>
              </Button>
            </HStack>
          </HStack>
        );
      })}
      <Button full info iconLeft onPress={handleAdd}>
        <Icon name="add-circle-outline" size={24}  color="white"/>
        <Text>Add</Text>
      </Button>
      <Modal isOpen={modalOpen} onClose={onCloseHandler}>
        <ModalModifierItemDetails modifier={modifier} modifierItem={selectedModifierItem} onClose={onCloseHandler} />
      </Modal>
    </>
  );
};

const enhance = c =>
  withObservables<ModifierItemsOuterProps, ModifierItemsInnerProps>(['modifier'], ({ modifier }) => {
    return {
      modifier,
      modifierItems: modifier.modifierItems,
    };
  })(c);

export const ModifierItems = enhance(ModifierItemsInner);
