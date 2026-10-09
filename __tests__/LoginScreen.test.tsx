import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Onboarding1 } from '../src/features/onboarding/screens/Onboarding1';
import { LoginScreen } from '../src/features/auth/screens/LoginScreen';

jest.mock('react-native-reanimated', () =>
  require('../test-utils/reanimatedMock'),
);
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('../src/features/auth/components/AuthEntrance', () => ({
  AuthEntrance: 'AuthEntrance',
}));
jest.mock('../src/features/auth/components/AuthHeroBackground', () => ({
  AuthHeroBackground: 'AuthHeroBackground',
}));
jest.mock('../src/features/auth/components/PageDots', () => ({
  PageDots: 'PageDots',
}));
const mockLogin = jest.fn();
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
}));
jest.mock('../src/features/auth/hooks/useLogin', () => ({
  useLogin: () => ({ mutate: mockLogin, isPending: false }),
}));
jest.mock('../src/theme', () => ({
  ...jest.requireActual('../src/theme/spacing'),
  ...jest.requireActual('../src/theme/radius'),
  ...jest.requireActual('../src/theme/fonts'),
  ...jest.requireActual('../src/theme/typography'),
  useTheme: () => ({
    colors: jest.requireActual('../src/theme/colors').lightColors,
  }),
}));
// Any icon key resolves to a host component name, so screens can add icons
// without this mock needing to know about them.
jest.mock('../src/constants/icons', () => ({
  icons: new Proxy({}, { get: (_target, key) => `Icon_${String(key)}` }),
}));
jest.mock('../src/components', () => ({
  Button: 'Button',
  TextInput: 'TextInput',
  ScreenContainer: 'ScreenContainer',
}));

beforeEach(() => jest.clearAllMocks());

async function renderLogin() {
  let renderer!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(<LoginScreen />);
  });
  return renderer;
}

test('normalizes a full Indian phone number and preserves the OTP navigation contract', async () => {
  const renderer = await renderLogin();
  await act(async () => {
    renderer.root
      .findByProps({ testID: 'login-mobile-number-input' })
      .props.onChangeText('+91 98765 43210');
  });
  await act(async () => {
    renderer.root
      .findByProps({ testID: 'login-continue-button' })
      .props.onPress();
  });
  expect(mockLogin).toHaveBeenCalledWith(
    { mobile: '9876543210' },
    expect.any(Object),
  );
  await act(async () => {
    mockLogin.mock.calls[0][1].onSuccess({ data: { otp: '1234' } });
  });
  expect(mockNavigate).toHaveBeenCalledWith('OTPVerification', {
    phoneNumber: '+919876543210',
    otp: '1234',
  });
});

test('rejects an invalid number without requesting an OTP', async () => {
  const renderer = await renderLogin();
  await act(async () => {
    renderer.root
      .findByProps({ testID: 'login-mobile-number-input' })
      .props.onChangeText('1234567890');
  });
  await act(async () => {
    renderer.root
      .findByProps({ testID: 'login-continue-button' })
      .props.onPress();
  });
  expect(mockLogin).not.toHaveBeenCalled();
  expect(
    renderer.root.findByProps({ testID: 'login-mobile-number-input' }).props
      .error,
  ).toContain('valid mobile number');
});

test('onboarding continues to the existing Login route', async () => {
  let renderer!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(<Onboarding1 />);
  });
  await act(async () => {
    renderer.root
      .findByProps({ testID: 'onboarding-get-started' })
      .props.onPress();
  });
  expect(mockNavigate).toHaveBeenCalledWith('Login');
});

test('a failed OTP request leaves the number intact and shows a recoverable error', async () => {
  const renderer = await renderLogin();
  await act(async () => {
    renderer.root
      .findByProps({ testID: 'login-mobile-number-input' })
      .props.onChangeText('9876543210');
  });
  await act(async () => {
    renderer.root
      .findByProps({ testID: 'login-continue-button' })
      .props.onPress();
  });
  await act(async () => {
    mockLogin.mock.calls[0][1].onError(
      new Error('Connection failed. Please try again.'),
    );
  });
  const input = renderer.root.findByProps({
    testID: 'login-mobile-number-input',
  });
  // Display is grouped as XXXXX XXXXX; the submitted value stays raw digits.
  expect(input.props.value).toBe('98765 43210');
  expect(input.props.error).toContain('Please try again');
});
