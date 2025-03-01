import { DatabaseProvider } from '@nozbe/watermelondb/DatabaseProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import decode from 'jwt-decode';
import { extendTheme, NativeBaseProvider, useToast } from 'native-base';
import React from 'react';
import { api } from './api';
import type { SignInParams, SignUpParams } from './api/auth';
import { signIn, signUp } from './api/auth';
import { Sync } from './components/Sync/Sync';
import { AuthContext } from './contexts/AuthContext';
import { database, resetDatabase } from './database';
import { SidebarNavigator } from './navigators/SidebarNavigator';
import { Main } from './screens/Main/Main';
import { SplashScreen } from './screens/SplashScreen/SplashScreen';

type ReducerState = {
  isSignout: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  organizationId: string | null;
  userId: string | null;
  isLoading: boolean;
  isSignInLoading: boolean;
  isSignUpLoading: boolean;
};

type RestoreTokenActionProps = Pick<ReducerState, 'accessToken' | 'refreshToken' | 'organizationId' | 'userId'>;
type SignInSuccessActionProps = Pick<ReducerState, 'accessToken' | 'refreshToken' | 'organizationId' | 'userId'>;

type ReducerAction =
  | ({ type: 'RESTORE_TOKEN' } & RestoreTokenActionProps)
  | { type: 'SIGN_IN_REQUEST' }
  | ({ type: 'SIGN_IN_SUCCESS' } & SignInSuccessActionProps)
  | { type: 'SIGN_IN_FAILED' }
  | { type: 'SIGN_UP_REQUEST' }
  | { type: 'SIGN_UP_SUCCESS' }
  | { type: 'SIGN_UP_FAILED' }
  | { type: 'SIGN_OUT' };

// Initialize NativeBase theme
const theme = extendTheme({
  config: {
    useSystemColorMode: false,
    initialColorMode: 'light',
  },
});

export default function App() {
  const toast = useToast();
  // if (env === 'local') {
  //   const whyDidYouRender = require('@welldone-software/why-did-you-render');
  //   whyDidYouRender(React, {
  //     trackAllPureComponents: true,
  //   });
  // }

  const reducer = (state: ReducerState, action: ReducerAction) => {
    switch (action.type) {
      case 'RESTORE_TOKEN':
        return {
          ...state,
          accessToken: action.accessToken,
          refreshToken: action.refreshToken,
          organizationId: action.organizationId,
          userId: action.userId,
          isLoading: false,
        };
      case 'SIGN_IN_SUCCESS':
        return {
          ...state,
          isSignout: false,
          accessToken: action.accessToken,
          refreshToken: action.refreshToken,
          organizationId: action.organizationId,
          userId: action.userId,
          isLoading: false,
          isSignInLoading: false,
        };
      case 'SIGN_IN_REQUEST':
        return {
          ...state,
          isSignInLoading: true,
        };
      case 'SIGN_IN_FAILED':
        return {
          ...state,
          isSignInLoading: false,
        };

      case 'SIGN_UP_REQUEST':
        return {
          ...state,
          isSignUpLoading: true,
        };
      case 'SIGN_UP_SUCCESS':
        return {
          ...state,
          isSignUpLoading: false,
        };
      case 'SIGN_UP_FAILED':
        return {
          ...state,
          isSignUpLoading: false,
        };
      case 'SIGN_OUT':
        return {
          ...state,
          isSignout: true,
          accessToken: null,
          refreshToken: null,
          organizationId: null,
          userId: null,
          isLoading: false,
        };
    }
  };
  const [state, dispatch] = React.useReducer(reducer, {
    isLoading: true,
    isSignout: false,
    accessToken: null,
    refreshToken: null,
    organizationId: null,
    userId: null,
    isSignInLoading: false,
    isSignUpLoading: false,
  });

  React.useEffect(() => {
    const bootstrapAsync = async () => {
      let accessToken;
      let refreshToken;
      let organizationId;
      let userId;
      // await resetDatabase();
      // await unsetAuth();
      try {
        const [aToken, rToken] = await AsyncStorage.multiGet(['accessToken', 'refreshToken']);
        accessToken = aToken[1];
        refreshToken = rToken[1];
      } catch (e) {
        console.error('Fetching tokens from local storage failed');
      }

      if (!accessToken || !refreshToken) {
        unsetAuth();
      }

      try {
        const decodedToken = decode(refreshToken);
        if (decodedToken.exp < new Date().getTime() / 1000) {
          unsetAuth();
          return;
        } else {
          organizationId = decodedToken.organizationId;
          userId = decodedToken.userId;
        }
      } catch (e) {
        unsetAuth();
        return;
      }

      if(accessToken && refreshToken) {

        api.setHeader('authorization', accessToken);
        api.setHeader('x-refresh-token', refreshToken);
  
        dispatch({ type: 'RESTORE_TOKEN', accessToken, refreshToken, organizationId, userId });
      }
      // dispatch({ type: 'SIGN_OUT' });
    };

    bootstrapAsync();
  }, []);

  const unsetAuth = async () => {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'organizationId', 'userId']);
    api.setHeader('authorization', '');
    api.setHeader('x-refresh-token', '');
    dispatch({ type: 'SIGN_OUT' });
  };

  const setAuth = async (params: {
    accessToken: string;
    refreshToken: string;
    organizationId: string;
    userId: string;
  }) => {
    const { accessToken, refreshToken, organizationId, userId } = params;
    api.setHeader('authorization', accessToken);
    api.setHeader('x-refresh-token', refreshToken);
    await AsyncStorage.multiSet([
      ['accessToken', accessToken],
      ['refreshToken', refreshToken],
      ['userId', userId],
      ['organizationId', organizationId],
    ]);
  };

  const authContext = React.useMemo(
    () => ({
      signIn: async (params: SignInParams) => {
        try {
          dispatch({ type: 'SIGN_IN_REQUEST' });
          const response = await signIn(params);

          if (response.data.success) {
            const accessToken = response.headers['authorization'];
            const refreshToken = response.headers['x-refresh-token'];

            const organizationId = response.data.data.organizationId;
            const userId = response.data.data.userId;

            await setAuth({
              accessToken,
              refreshToken,
              organizationId,
              userId,
            });

            dispatch({ type: 'SIGN_IN_SUCCESS', accessToken, refreshToken, organizationId, userId });
          } else {
            throw new Error('Sign in failed');
          }
        } catch (err) {
          dispatch({ type: 'SIGN_IN_FAILED' });
          toast.show({ title: 'Failed to sign in' , 
            placement: 'bottom',
            variant: 'solid',});
        }
      },
      signOut: async () => {
        try {
          await unsetAuth();
        } catch (err) {
          toast.show({ title: 'Failed to sign out' , 
            placement: 'bottom',
            variant: 'solid',});
        }
      },
      signUp: async (bodyData: SignUpParams) => {
        // TODO: handle errors
        try {
          dispatch({ type: 'SIGN_UP_REQUEST' });

          const response = await signUp(bodyData);
          if (response.data.success) {
            const accessToken = response.headers['authorization'];
            const refreshToken = response.headers['x-refresh-token'];
            await setAuth({
              accessToken,
              refreshToken,
              organizationId: response.data.data.organizationId,
              userId: response.data.data.userId,
            });
            toast.show({ title: 'Successfully signed up, please login.', 
              placement: 'bottom',
              variant: 'solid',});
            dispatch({ type: 'SIGN_UP_SUCCESS' });

            return { success: true };
          } else {
            throw new Error('Sign up failed');
          }
        } catch (err) {
          dispatch({ type: 'SIGN_UP_FAILED' });
          toast.show({ title: `Sign up failed` , 
            placement: 'bottom',
            variant: 'solid',});
          return { success: false };
        }
      },
      unlink: async () => {
        try {
          await resetDatabase();
          await unsetAuth();
          toast.show({ title: 'Sucessfully unlinked', 
            placement: 'bottom',
            variant: 'solid',});
        } catch (err) {
          toast.show({ title: 'Failed to sign out' , 
            placement: 'bottom',
            variant: 'solid',});
        }
      },
    }),
    [],
  );

  const { isLoading, refreshToken, accessToken, userId, organizationId, isSignInLoading, isSignUpLoading } = state;

  const drawerTheme = {
    dark: false,
    colors: {
      primary: '#000',
      background: '#fff',
      card: '#fff',
      text: '#000',
      border: '#ccc',
      notification: '#f00',
    },
    fonts: {
      regular: {
        fontFamily: 'System',
        fontWeight: '400',
      },
      medium: {
        fontFamily: 'System',
        fontWeight: '500',
      },
      bold: {
        fontFamily: 'System',
        fontWeight: '700',
      },
      heavy: {
        fontFamily: 'System',
        fontWeight: '900',
      },
      light: {
        fontFamily: 'System',
        fontWeight: '300',
      },
    },
  } as const;

  return (
    <NativeBaseProvider theme={theme}>
      <DatabaseProvider database={database}>
          <AuthContext.Provider 
            value={{
              ...authContext,
              isSignInLoading: state.isSignInLoading,
              isSignUpLoading: state.isSignUpLoading,
              accessToken: state.accessToken,
              refreshToken: state.refreshToken,
              organizationId: state.organizationId,
              userId: state.userId,
              isLoading: state.isLoading,
              isSignout: state.isSignout
            }}
          >
            {state.isLoading ? (
              <SplashScreen />
            ) : (
              <NavigationContainer theme={drawerTheme}>
                <SidebarNavigator />
              </NavigationContainer>
            )}
          </AuthContext.Provider>
      </DatabaseProvider>
    </NativeBaseProvider>
  );
};
