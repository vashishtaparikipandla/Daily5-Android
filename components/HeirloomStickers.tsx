import React from 'react';
import { Image, StyleSheet } from 'react-native';

export const STICKER_ASSETS: Record<string, any> = {
  'stk-ghost': require('@/assets/images/stickers/ghost-3d.png'),
  'stk-lollipop': require('@/assets/images/stickers/lollipop-3d.png'),
  'stk-thumbsup': require('@/assets/images/stickers/thumbsup-3d.png'),
  'stk-shield': require('@/assets/images/stickers/shield-3d.png'),
  'stk-star': require('@/assets/images/stickers/star-3d.png'),
  'stk-heart': require('@/assets/images/stickers/heart.png'),
  'stk-hearteyes': require('@/assets/images/stickers/heartEyes.png'),
  'stk-party': require('@/assets/images/stickers/party.png'),
  'stk-sunglasses': require('@/assets/images/stickers/sunglasses.png'),
  'stk-kiss': require('@/assets/images/stickers/kiss.png'),
  'stk-robot': require('@/assets/images/stickers/robot.png'),
  'stk-smile': require('@/assets/images/stickers/smile.png'),
};

export interface StickerCatalogItem {
  id: string;
  name: string;
  asset: any;
  render: (size?: number) => React.ReactNode;
}

export const STICKER_CATALOG: StickerCatalogItem[] = [
  {
    id: 'stk-ghost',
    name: 'Spooky Ghost',
    asset: STICKER_ASSETS['stk-ghost'],
    render: (size = 46) => (
      <Image
        source={STICKER_ASSETS['stk-ghost']}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    ),
  },
  {
    id: 'stk-lollipop',
    name: 'Swirl Lollipop',
    asset: STICKER_ASSETS['stk-lollipop'],
    render: (size = 46) => (
      <Image
        source={STICKER_ASSETS['stk-lollipop']}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    ),
  },
  {
    id: 'stk-thumbsup',
    name: 'Thumbs Up',
    asset: STICKER_ASSETS['stk-thumbsup'],
    render: (size = 46) => (
      <Image
        source={STICKER_ASSETS['stk-thumbsup']}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    ),
  },
  {
    id: 'stk-shield',
    name: 'Verified Shield',
    asset: STICKER_ASSETS['stk-shield'],
    render: (size = 46) => (
      <Image
        source={STICKER_ASSETS['stk-shield']}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    ),
  },
  {
    id: 'stk-star',
    name: '3D Star',
    asset: STICKER_ASSETS['stk-star'],
    render: (size = 46) => (
      <Image
        source={STICKER_ASSETS['stk-star']}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    ),
  },
  {
    id: 'stk-heart',
    name: 'Glossy Heart',
    asset: STICKER_ASSETS['stk-heart'],
    render: (size = 46) => (
      <Image
        source={STICKER_ASSETS['stk-heart']}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    ),
  },
  {
    id: 'stk-hearteyes',
    name: 'Heart Eyes',
    asset: STICKER_ASSETS['stk-hearteyes'],
    render: (size = 46) => (
      <Image
        source={STICKER_ASSETS['stk-hearteyes']}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    ),
  },
  {
    id: 'stk-party',
    name: 'Party Popper',
    asset: STICKER_ASSETS['stk-party'],
    render: (size = 46) => (
      <Image
        source={STICKER_ASSETS['stk-party']}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    ),
  },
  {
    id: 'stk-sunglasses',
    name: 'Cool Sunglasses',
    asset: STICKER_ASSETS['stk-sunglasses'],
    render: (size = 46) => (
      <Image
        source={STICKER_ASSETS['stk-sunglasses']}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    ),
  },
  {
    id: 'stk-kiss',
    name: 'Blowing Kiss',
    asset: STICKER_ASSETS['stk-kiss'],
    render: (size = 46) => (
      <Image
        source={STICKER_ASSETS['stk-kiss']}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    ),
  },
  {
    id: 'stk-robot',
    name: 'Retro Robot',
    asset: STICKER_ASSETS['stk-robot'],
    render: (size = 46) => (
      <Image
        source={STICKER_ASSETS['stk-robot']}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    ),
  },
  {
    id: 'stk-smile',
    name: 'Big Smile',
    asset: STICKER_ASSETS['stk-smile'],
    render: (size = 46) => (
      <Image
        source={STICKER_ASSETS['stk-smile']}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    ),
  },
];
