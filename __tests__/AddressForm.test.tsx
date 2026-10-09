import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { AddressForm } from '../src/features/addresses/components/AddressForm';

jest.mock('@/components', () => ({ Button: 'Button', TextInput: 'TextInput' }));
jest.mock('lucide-react-native', () => ({ Briefcase: 'Icon', Check: 'Icon', Crosshair: 'Icon', Home: 'Icon', MapPin: 'Icon' }));
jest.mock('@/theme', () => ({
  useTheme: () => ({ colors: {} }), fonts: {}, radius: {}, spacing: {},
}));

const area = { id: 1, name: 'Calicut', pincode: '673001' };
const coordinates = { latitude: 11.26, longitude: 75.78 };

test('prefills contacts without replacing user edits when the profile arrives later', async () => {
  let rendered!: Renderer.ReactTestRenderer;
  const props = { deliveryArea: area, submitLabel: 'Save', onSubmit: jest.fn(), onChooseLocation: jest.fn() };
  await act(() => { rendered = Renderer.create(<AddressForm {...props} />); });
  const input = (label: string) => rendered.root.findAllByType('TextInput' as any).find(node => node.props.label === label)!;
  await act(() => { input('Contact name').props.onChangeText('Recipient'); });
  await act(() => { rendered.update(<AddressForm {...props} defaultName="Account name" defaultMobile="9876543210" />); });
  expect(input('Contact name').props.value).toBe('Recipient');
  expect(input('Contact mobile').props.value).toBe('9876543210');
  await act(() => rendered.unmount());
});

test('requires a confirmed pin and submits fixed district and state with editable contact details', async () => {
  let rendered!: Renderer.ReactTestRenderer;
  const onSubmit = jest.fn();
  const props = { deliveryArea: area, submitLabel: 'Save', onSubmit, onChooseLocation: jest.fn(), defaultName: 'Account name', defaultMobile: '9876543210' };
  await act(() => { rendered = Renderer.create(<AddressForm {...props} />); });
  const input = (label: string) => rendered.root.findAllByType('TextInput' as any).find(node => node.props.label === label)!;
  await act(() => {
    input('Contact name').props.onChangeText('Delivery recipient');
    input('Contact mobile').props.onChangeText('9123456789');
    input('Address line 1').props.onChangeText('House 12');
    input('City').props.onChangeText('Calicut');
  });
  await act(() => rendered.root.findByType('Button' as any).props.onPress());
  expect(onSubmit).not.toHaveBeenCalled();
  await act(() => rendered.update(<AddressForm {...props} selectedCoordinates={coordinates} />));
  await act(() => rendered.root.findByType('Button' as any).props.onPress());
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
    district: 'Calicut', state: 'Kerala', contact_name: 'Delivery recipient', contact_mobile: '9123456789', ...coordinates,
  }), false);
  expect(rendered.root.findAllByType('TextInput' as any).map(node => node.props.label)).not.toEqual(expect.arrayContaining(['State', 'District (optional)']));
  await act(() => rendered.unmount());
});
