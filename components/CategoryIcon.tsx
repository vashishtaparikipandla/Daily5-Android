import React from 'react';
import {
  ForkKnife,
  Airplane,
  Users,
  Briefcase,
  Heart,
  BookOpen,
  House,
  HeartStraight,
  DotsThreeCircle,
  type IconProps,
} from 'phosphor-react-native';
import type { CategoryId } from '@/lib/data';

interface Props extends IconProps {
  id: CategoryId | string;
}

export function CategoryIcon({ id, size = 16, color = '#E8593A', weight = 'regular', ...rest }: Props) {
  switch (id) {
    case 'food':
      return <ForkKnife size={size} color={color} weight={weight} {...rest} />;
    case 'travel':
      return <Airplane size={size} color={color} weight={weight} {...rest} />;
    case 'people':
      return <Users size={size} color={color} weight={weight} {...rest} />;
    case 'work':
      return <Briefcase size={size} color={color} weight={weight} {...rest} />;
    case 'health':
      return <Heart size={size} color={color} weight={weight} {...rest} />;
    case 'learning':
      return <BookOpen size={size} color={color} weight={weight} {...rest} />;
    case 'home':
      return <House size={size} color={color} weight={weight} {...rest} />;
    case 'love':
      return <HeartStraight size={size} color={color} weight={weight} {...rest} />;
    case 'other':
    default:
      return <DotsThreeCircle size={size} color={color} weight={weight} {...rest} />;
  }
}
