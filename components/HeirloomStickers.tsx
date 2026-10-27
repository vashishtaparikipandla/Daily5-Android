import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, {
  Rect,
  Circle,
  Path,
  G,
  Ellipse,
  Polygon,
  Line,
  Text as SvgText,
} from 'react-native-svg';

export interface StickerCatalogItem {
  id: string;
  name: string;
  render: (size?: number) => React.ReactNode;
}

export const STICKER_CATALOG: StickerCatalogItem[] = [
  {
    id: 'stk-music',
    name: 'Music',
    render: (size = 48) => (
      <Svg width={size} height={size} viewBox="0 0 60 60">
        <Rect x="5" y="5" width="50" height="50" rx="15" fill="#FFF7EB" stroke="#F2C97D" strokeWidth="2.5" />
        <Path d="M23 40 V20 L41 16 V36" fill="none" stroke="#DF5739" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx="19" cy="40" r="5.5" fill="#DF5739" />
        <Circle cx="37" cy="36" r="5.5" fill="#DF5739" />
      </Svg>
    ),
  },
  {
    id: 'stk-clock',
    name: 'Clock',
    render: (size = 48) => (
      <Svg width={size} height={size} viewBox="0 0 60 60">
        <Circle cx="30" cy="30" r="25" fill="#FFE484" stroke="#E09F1F" strokeWidth="2.5" />
        <Circle cx="30" cy="30" r="19" fill="#FFFDF7" />
        <Path d="M30 17 V30 L38 34" fill="none" stroke="#2B2420" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    ),
  },
  {
    id: 'stk-heart',
    name: 'Heart',
    render: (size = 48) => (
      <Svg width={size} height={size} viewBox="0 0 60 60">
        <Circle cx="30" cy="30" r="25" fill="#FFD6E0" stroke="#E06377" strokeWidth="2.5" />
        <Path
          d="M30 43 C30 43 16 33 16 23 C16 18 21 15 25 18 C28 19 30 22 30 22 C30 22 32 19 35 18 C39 15 44 18 44 23 C44 33 30 43 30 43 Z"
          fill="#E03E52"
        />
      </Svg>
    ),
  },
  {
    id: 'stk-flower',
    name: 'Daisy Flower',
    render: (size = 48) => (
      <Svg width={size} height={size} viewBox="0 0 60 60">
        <G fill="#FFFDF9" stroke="#E2D9C8" strokeWidth="1.5">
          <Ellipse cx="30" cy="14" rx="6.5" ry="11" />
          <Ellipse cx="30" cy="46" rx="6.5" ry="11" />
          <Ellipse cx="14" cy="30" rx="11" ry="6.5" />
          <Ellipse cx="46" cy="30" rx="11" ry="6.5" />
          <G transform="rotate(-45 30 30)">
            <Ellipse cx="30" cy="14" rx="6.5" ry="11" />
            <Ellipse cx="30" cy="46" rx="6.5" ry="11" />
            <Ellipse cx="14" cy="30" rx="11" ry="6.5" />
            <Ellipse cx="46" cy="30" rx="11" ry="6.5" />
          </G>
        </G>
        <Circle cx="30" cy="30" r="8.5" fill="#FFBD00" stroke="#D99B00" strokeWidth="1.5" />
      </Svg>
    ),
  },
  {
    id: 'stk-camera',
    name: 'Camera',
    render: (size = 48) => (
      <Svg width={size} height={size * 0.88} viewBox="0 0 64 56">
        <Rect x="6" y="12" width="52" height="36" rx="8" fill="#3B3532" stroke="#F4EFE6" strokeWidth="2.5" />
        <Rect x="18" y="6" width="16" height="6" rx="2" fill="#DF5739" />
        <Circle cx="34" cy="30" r="11" fill="#F2C97D" stroke="#FAF6F0" strokeWidth="2.5" />
        <Circle cx="34" cy="30" r="5" fill="#231F1D" />
        <Circle cx="16" cy="21" r="3.5" fill="#FFBD00" />
      </Svg>
    ),
  },
  {
    id: 'stk-rainbow',
    name: 'Rainbow',
    render: (size = 48) => (
      <Svg width={size} height={size * 0.82} viewBox="0 0 64 52">
        <Path d="M8 42 A24 24 0 0 1 56 42" fill="none" stroke="#E05A47" strokeWidth="5" strokeLinecap="round" />
        <Path d="M13 42 A19 19 0 0 1 51 42" fill="none" stroke="#F2A93B" strokeWidth="5" strokeLinecap="round" />
        <Path d="M18 42 A14 14 0 0 1 46 42" fill="none" stroke="#62B6CB" strokeWidth="5" strokeLinecap="round" />
      </Svg>
    ),
  },
  {
    id: 'stk-coffee',
    name: 'Coffee Mug',
    render: (size = 48) => (
      <Svg width={size} height={size} viewBox="0 0 60 60">
        <Path d="M14 22 H42 V36 C42 44 35 49 28 49 C21 49 14 44 14 36 Z" fill="#D9825B" stroke="#8C4A2E" strokeWidth="2.5" />
        <Path d="M42 25 H47 C50 25 52 27 52 30 C52 33 50 35 47 35 H42" fill="none" stroke="#8C4A2E" strokeWidth="2.5" />
        <Path d="M22 15 Q24 10 22 7 M30 15 Q32 10 30 7 M36 15 Q38 10 36 7" fill="none" stroke="#B89F8D" strokeWidth="2" strokeLinecap="round" />
      </Svg>
    ),
  },
  {
    id: 'stk-star',
    name: 'Golden Star',
    render: (size = 48) => (
      <Svg width={size} height={size} viewBox="0 0 60 60">
        <Polygon points="30,5 37,21 55,23 41,35 45,53 30,43 15,53 19,35 5,23 23,21" fill="#FFBD00" stroke="#D99B00" strokeWidth="2.2" />
      </Svg>
    ),
  },
  {
    id: 'stk-tape',
    name: 'Washi Tape',
    render: (size = 54) => (
      <Svg width={size} height={size * 0.44} viewBox="0 0 90 40">
        <Path d="M4 8 L86 5 L83 33 L6 35 Z" fill="#84C7AE" fillOpacity="0.9" stroke="#569E85" strokeWidth="1.5" />
        <Path d="M18 7 L18 34 M36 7 L36 34 M54 6 L54 33 M72 6 L72 33" stroke="#FFFFFF" strokeWidth="2" strokeOpacity="0.65" />
      </Svg>
    ),
  },
  {
    id: 'stk-love',
    name: 'Best Day Pill',
    render: (size = 54) => (
      <Svg width={size} height={size * 0.52} viewBox="0 0 84 44">
        <Rect x="3" y="6" width="78" height="32" rx="16" fill="#FFF8F0" stroke="#DF5739" strokeWidth="2" />
        <SvgText
          x="42"
          y="27"
          textAnchor="middle"
          fontSize="17"
          fontWeight="bold"
          fill="#C8462A"
          fontFamily="serif"
        >
          best day ♡
        </SvgText>
      </Svg>
    ),
  },
  {
    id: 'stk-sun',
    name: 'Radiant Sun',
    render: (size = 48) => (
      <Svg width={size} height={size} viewBox="0 0 60 60">
        <Circle cx="30" cy="30" r="14" fill="#FFA834" stroke="#E07A12" strokeWidth="2" />
        <G stroke="#FFA834" strokeWidth="3" strokeLinecap="round">
          <Line x1="30" y1="6" x2="30" y2="11" />
          <Line x1="30" y1="49" x2="30" y2="54" />
          <Line x1="6" y1="30" x2="11" y2="30" />
          <Line x1="49" y1="30" x2="54" y2="30" />
          <Line x1="13" y1="13" x2="17" y2="17" />
          <Line x1="43" y1="43" x2="47" y2="47" />
          <Line x1="47" y1="13" x2="43" y2="17" />
          <Line x1="17" y1="43" x2="13" y2="47" />
        </G>
      </Svg>
    ),
  },
  {
    id: 'stk-stamp',
    name: 'Postal Stamp',
    render: (size = 48) => (
      <Svg width={size} height={size * 1.12} viewBox="0 0 64 72">
        <Rect x="6" y="6" width="52" height="60" rx="4" fill="#F7F1E3" stroke="#5B7B9C" strokeWidth="2.5" strokeDasharray="4 3" />
        <Rect x="12" y="12" width="40" height="48" fill="#D5E5F2" />
        <Circle cx="32" cy="32" r="10" fill="#E06D53" />
        <Path d="M18 50 Q32 42 46 50" fill="none" stroke="#3B5978" strokeWidth="2.5" />
      </Svg>
    ),
  },
];
