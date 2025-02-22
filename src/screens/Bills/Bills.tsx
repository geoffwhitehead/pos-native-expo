import React, { useContext } from 'react';
import { SidebarHeader } from '../../components/SidebarHeader/SidebarHeader';
import { BillPeriodContext } from '../../contexts/BillPeriodContext';
import { Container } from '../../core';
import { SelectBill } from './SelectBill/SelectBill';
import { sidebarRoutes } from '../../navigators/routes';

export const Bills = ({ navigation }) => {
  const openDrawer = () => navigation.openDrawer();
  const { billPeriod } = useContext(BillPeriodContext);
  const onSelectBill = () => navigation.navigate(sidebarRoutes.checkout);

  return (
    <Container>
      <SidebarHeader title="Bills" onOpen={openDrawer} />
      <SelectBill billPeriod={billPeriod} onSelectBill={onSelectBill} />
    </Container>
  );
};
