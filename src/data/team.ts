import type { ImageMetadata } from 'astro';
import samuel from '../assets/team/samuel.jpg';
import sarbah from '../assets/team/sarbah.jpg';

export type Member = {
  name: string;
  role: string;
  quote: string;
  email: string;
  photo: ImageMetadata;
};

export const team: Member[] = [
  {
    name: 'Samuel Yeboah Agyemang Badu',
    role: 'Founder',
    quote:
      'Success is built by combining the right skills, discipline and opportunities. When people are empowered with all three, growth becomes inevitable.',
    email: 'yeboahs758@gmail.com',
    photo: samuel,
  },
  {
    name: 'Sarbah Precious',
    role: 'Co-Founder',
    quote:
      'Great achievements are built through small, consistent actions repeated with purpose, patience, and commitment.',
    email: 'sarbahprecious17@gmail.com',
    photo: sarbah,
  },
];
