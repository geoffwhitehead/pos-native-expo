import type { Database } from '@nozbe/watermelondb';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import withObservables from '@nozbe/with-observables';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import LottieView from 'lottie-react-native';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, StatusBar, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import envKey from '../../../../build.env';
import { AuthContext } from '../../../contexts/AuthContext';
import { Button, Container, Form, Input, Item, Label, Spinner, Text, useDisclose } from '../../../core';
import type { Organization } from '../../../models';
import type { AuthStackParamList } from '../../../navigators/AuthNavigator';
import { colors } from '../../../theme';
import { resolveButtonState } from '../../../utils/helpers';
import { moderateScale } from '../../../utils/scaling';
import { tableNames } from '../../../models/tableNames';
import { ConfirmationActionsheet } from '../../../components/ConfirmationActionsheet/ConfirmationActionsheet';

interface SignInOuterProps {
  navigation: StackNavigationProp<AuthStackParamList, 'SignIn'>;
  route: RouteProp<AuthStackParamList, 'SignIn'>;
  database: Database;
}

interface SignInInnerProps {
  organizations: Organization[];
}

const initialValues = {
  email: envKey === 'local' ? 'dev@dev.dev' : '',
  password: envKey === 'local' ? 'devdevdev' : '',
};

export const SignInInner: React.FC<SignInOuterProps & SignInInnerProps> = ({ navigation, route, organizations }) => {
  const [organization, setOrganization] = useState<Organization | null>();
  const [email, setEmail] = useState(initialValues.email);
  const [password, setPassword] = useState(initialValues.password);
  const animation = useRef();
  const { isOpen, onOpen, onClose } = useDisclose();

  useEffect(() => {
    const org = organizations?.[0];
    if (org) {
      setOrganization(org);
      setEmail(org.email);
    } else {
      setOrganization(null);
      setEmail(null);
    }
  }, [organizations]);

  const { signIn, unlink, isSignInLoading } = useContext(AuthContext);

  const handleUnlink = async () => {
    await unlink();
    onClose();
    navigation.navigate('SignIn');
  };

  return (
    <Container style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView>
        <KeyboardAvoidingView style={styles.signin}>
          <LottieView
            style={{ height: 300, width: 300 }}
            source={require('../../../animations/9788-add-new.json')}
            autoPlay={true}
            loop={false}
            ref={animation}
          />
          <Form style={styles.form}>
            <Item stackedLabel>
              <Label style={styles.text}>Email</Label>
              {organization ? (
                <Label style={styles.text}>{organization.name}</Label>
              ) : (
                <Input style={styles.text} autoCapitalize="none" onChangeText={setEmail} value={email} />
              )}
            </Item>
            <Item stackedLabel>
              <Label style={styles.text}>Password</Label>

              <Input style={styles.text} value={password} onChangeText={setPassword} secureTextEntry />
            </Item>
            <Button
              {...resolveButtonState(isSignInLoading, 'info')}
              full
              disabled={isSignInLoading}
              style={styles.button}
              onPress={() => signIn({ email, password })}
            >
              {!isSignInLoading && <Text>Sign in</Text>}
              {isSignInLoading && <Spinner color="white" />}
            </Button>
            {!organization && (
              <Button
                full
                style={{ ...styles.button, backgroundColor: 'white' }}
                light
                onPress={() => navigation.navigate('SignUp')}
              >
                <Text>Register</Text>
              </Button>
            )}
            {organization && (
              <Button
                full
                style={{ ...styles.button, backgroundColor: 'white' }}
                light
                onPress={onOpen}
              >
                <Text>Unlink</Text>
              </Button>
            )}
            {organization && (
              <Text style={{ padding: 20 }} note>
                * This terminal is currently linked with {organization.name}.
              </Text>
            )}
          </Form>
        </KeyboardAvoidingView>
      </ScrollView>

      <ConfirmationActionsheet
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={handleUnlink}
        message="Are you sure you want to unlink this device? This will remove all local data."
      />
    </Container>
  );
};

const enhance = c =>
  withDatabase<any>(
    withObservables<SignInOuterProps, SignInInnerProps>(null, ({ database }) => ({
      organizations: database.collections.get<Organization>(tableNames.organizations).query(),
    }))(c),
  );

export const SignIn = enhance(SignInInner);

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.darkBlue,
  },
  form: {
    width: moderateScale(500),
  },
  signin: {
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'column',
    alignItems: 'center',
    alignContent: 'center',

    marginTop: moderateScale(100),
  },
  button: {
    marginLeft: moderateScale(15),
    marginTop: moderateScale(10),
  },
  text: {
    color: 'white',
  },
} as const);
