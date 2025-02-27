import { createDrawerNavigator } from '@react-navigation/drawer';
import React, { useContext } from 'react';
import { StyleSheet } from 'react-native';
import { Bills } from '../screens/Bills/Bills';
import { Checkout } from '../screens/Checkout/Checkout';
import { Items } from '../screens/Items/Items';
import { Reports } from '../screens/Reports/Reports';
import { Settings } from '../screens/Settings/Settings';
import { Transactions } from '../screens/Transactions/Transactions';
import { colors } from '../theme';
import { AuthNavigator } from './AuthNavigator';
import { AuthContext } from '../contexts/AuthContext';
import { Sync } from '../components/Sync/Sync';
import { database } from '../database';
import { Main } from '../screens/Main/Main';

export type SidebarDrawerStackParamList = {
  Auth: undefined;
  Checkout: undefined;
  Items: undefined;
  Reports: undefined;
  Bills: undefined;
  Transactions: undefined;
  Settings: undefined;
};

export const SidebarNavigator: React.FC = () => {
  const Drawer = createDrawerNavigator<SidebarDrawerStackParamList>();
  const { accessToken, refreshToken, organizationId, userId, isSignout } = useContext(AuthContext);
  const isAuthenticated = !!(accessToken && refreshToken && organizationId && userId && !isSignout);

  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  return (
    <Sync database={database} organizationId={organizationId}>
      <Main database={database} organizationId={organizationId} userId={userId}>
        <Drawer.Navigator 
          initialRouteName="Checkout" 
          screenOptions={{
            drawerStyle: styles.drawer,
            drawerLabelStyle: styles.drawerLabel,
            drawerInactiveTintColor: colors.txtLightGrey,
            drawerActiveBackgroundColor: colors.highlightBlue,
            drawerInactiveBackgroundColor: 'transparent',
            drawerItemStyle: { borderRadius: 12 },
            headerShown: false,
            overlayColor: 'transparent'
          }}
        >
          <Drawer.Screen 
            name="Checkout" 
            component={Checkout}
            options={{
              drawerLabel: 'Checkout'
            }}
          />
          <Drawer.Screen 
            name="Items" 
            component={Items}
            options={{
              drawerLabel: 'Items'
            }}
          />
          <Drawer.Screen 
            name="Reports" 
            component={Reports}
            options={{
              drawerLabel: 'Reports'
            }}
          />
          <Drawer.Screen 
            name="Bills" 
            component={Bills}
            options={{
              drawerLabel: 'Bills'
            }}
          />
          <Drawer.Screen 
            name="Transactions" 
            component={Transactions}
            options={{
              drawerLabel: 'Transactions'
            }}
          />
          <Drawer.Screen 
            name="Settings" 
            component={Settings}
            options={{
              drawerLabel: 'Settings'
            }}
          />
        </Drawer.Navigator>
      </Main>
    </Sync>
  );
};

const styles = StyleSheet.create({
  drawer: {
    backgroundColor: colors.bgGreyBlue,
    width: 280,
    borderRightWidth: 0
  },
  drawerLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: -8,
    color: colors.white
  }
});
