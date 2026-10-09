import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { OTPVerificationScreen } from '../src/features/auth/screens/OTPVerificationScreen';

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
const mockVerify = jest.fn();
const mockGoBack = jest.fn();
let mockParams: { phoneNumber: string; otp?: string } = {
  phoneNumber: '+919876543210',
};
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: mockGoBack }),
  useRoute: () => ({ params: mockParams }),
}));
jest.mock('../src/features/auth/hooks/useVerifyOtp', () => ({
  useVerifyOtp: () => ({ mutate: mockVerify, isPending: false }),
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
jest.mock('../src/constants/icons', () => ({
  icons: new Proxy({}, { get: (_target, key) => `Icon_${String(key)}` }),
}));
jest.mock('../src/components', () => ({
  Button: 'Button',
  Header: 'Header',
  OTPInput: 'OTPInput',
  ScreenContainer: 'ScreenContainer',
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = { phoneNumber: '+919876543210' };
});

const mounted: TestRenderer.ReactTestRenderer[] = [];

// Unmount so the screen's resend interval never outlives its test.
afterEach(async () => {
  await act(async () => {
    mounted.splice(0).forEach(renderer => renderer.unmount());
  });
});

async function renderOtp() {
  let renderer!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(<OTPVerificationScreen />);
  });
  mounted.push(renderer);
  return renderer;
}

const textOf = (renderer: TestRenderer.ReactTestRenderer, testID: string) =>
  [renderer.root.findByProps({ testID }).props.children].flat().join('');

test('starts with empty boxes, a grouped phone number and locked resend', async () => {
  const renderer = await renderOtp();
  expect(renderer.root.findByProps({ testID: 'otp-input' }).props.value).toBe(
    '',
  );
  expect(textOf(renderer, 'otp-phone-number')).toBe('+91 98765 43210');
  expect(
    renderer.root.findByProps({ testID: 'otp-resend-button' }).props.disabled,
  ).toBe(true);
  expect(
    renderer.root.findByProps({ testID: 'otp-verify-button' }).props.disabled,
  ).toBe(true);
});

test('prefills a server-provided OTP', async () => {
  mockParams = { phoneNumber: '+919876543210', otp: '4821' };
  const renderer = await renderOtp();
  expect(renderer.root.findByProps({ testID: 'otp-input' }).props.value).toBe(
    '4821',
  );
  expect(
    renderer.root.findByProps({ testID: 'otp-verify-button' }).props.disabled,
  ).toBe(false);
});

test('verifies with the bare 10-digit number and flags a failed attempt', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const renderer = await renderOtp();
  await act(async () => {
    renderer.root.findByProps({ testID: 'otp-input' }).props.onChange('1234');
  });
  await act(async () => {
    renderer.root.findByProps({ testID: 'otp-verify-button' }).props.onPress();
  });
  expect(mockVerify).toHaveBeenCalledWith(
    { mobile: '9876543210', otp: '1234' },
    expect.any(Object),
  );
  await act(async () => {
    mockVerify.mock.calls[0][1].onError(new Error('bad code'));
  });
  expect(renderer.root.findByProps({ testID: 'otp-input' }).props.error).toBe(
    true,
  );
  // Editing the code clears the error state again.
  await act(async () => {
    renderer.root.findByProps({ testID: 'otp-input' }).props.onChange('123');
  });
  expect(renderer.root.findByProps({ testID: 'otp-input' }).props.error).toBe(
    false,
  );
  warn.mockRestore();
});

test('Edit returns to the number entry screen', async () => {
  const renderer = await renderOtp();
  await act(async () => {
    renderer.root.findByProps({ testID: 'otp-edit-button' }).props.onPress();
  });
  expect(mockGoBack).toHaveBeenCalled();
});

test('resend unlocks after the countdown and clears the code', async () => {
  jest.useFakeTimers();
  mockParams = { phoneNumber: '+919876543210', otp: '4821' };
  const renderer = await renderOtp();
  await act(async () => {
    jest.advanceTimersByTime(28_000);
  });
  expect(
    renderer.root.findByProps({ testID: 'otp-resend-button' }).props.disabled,
  ).toBe(false);
  await act(async () => {
    renderer.root.findByProps({ testID: 'otp-resend-button' }).props.onPress();
  });
  expect(renderer.root.findByProps({ testID: 'otp-input' }).props.value).toBe(
    '',
  );
  expect(
    renderer.root.findByProps({ testID: 'otp-resend-button' }).props.disabled,
  ).toBe(true);
  jest.useRealTimers();
});
