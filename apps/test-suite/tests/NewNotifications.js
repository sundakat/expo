'use strict';

import { Platform } from '@unimodules/core';
import * as Notifications from 'expo-notifications';
import * as FileSystem from 'expo-file-system';

import * as TestUtils from '../TestUtils';
import { waitFor } from './helpers';

export const name = 'expo-notifications';

export async function test(t) {
  const shouldSkipTestsRequiringPermissions = await TestUtils.shouldSkipTestsRequiringPermissionsAsync();
  const describeWithPermissions = shouldSkipTestsRequiringPermissions ? t.xdescribe : t.describe;

  describeWithPermissions('expo-notifications', () => {
    t.describe('getDevicePushTokenAsync', () => {
      let subscription = null;
      let tokenFromEvent = null;
      let tokenFromMethodCall = null;

      t.beforeAll(() => {
        subscription = Notifications.addPushTokenListener(newEvent => {
          tokenFromEvent = newEvent;
        });
      });

      t.afterAll(() => {
        if (subscription) {
          subscription.remove();
          subscription = null;
        }
      });

      if (Platform.OS === 'android' || Platform.OS === 'ios') {
        t.it('resolves with a string', async () => {
          const devicePushToken = await Notifications.getDevicePushTokenAsync();
          t.expect(typeof devicePushToken.data).toBe('string');
          tokenFromMethodCall = devicePushToken;
        });
      }

      if (Platform.OS === 'web') {
        t.it('resolves with an object', async () => {
          const devicePushToken = await Notifications.getDevicePushTokenAsync();
          t.expect(typeof devicePushToken.data).toBe('object');
          tokenFromMethodCall = devicePushToken;
        });
      }

      t.it('emits an event with token (or not, if getDevicePushTokenAsync failed)', async () => {
        // It would be better to do `if (!tokenFromMethodCall) { pending(); } else { ... }`
        // but `t.pending()` still doesn't work.
        await waitFor(500);
        t.expect(tokenFromEvent).toEqual(tokenFromMethodCall);
      });
    });

    t.describe('presentNotificationAsync', () => {
      t.it('presents a simple notification', async () => {
        await Notifications.presentNotificationAsync({
          title: 'Sample title',
          subtitle: 'What an event!',
          message: 'An interesting event has just happened',
          badge: 1,
        });
      });

      t.it('presents a notification with attachments', async () => {
        const fileUri = FileSystem.documentDirectory + 'expo-notifications-test-image.jpg';
        await FileSystem.downloadAsync('http://placekitten.com/200/300', fileUri);
        await Notifications.presentNotificationAsync({
          title: 'Look at that kitten! ➡️',
          message: 'What a cutie!',
          ios: {
            attachments: [{ uri: fileUri }],
          },
          android: {
            thumbnailUri: fileUri,
          },
        });
      });
    });
  });
}
