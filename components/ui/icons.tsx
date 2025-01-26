import {
  Loader2,
  LucideProps,
} from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';

export const Icons = {
  spinner: Loader2,
  google: FcGoogle,
};

export type Icon = keyof typeof Icons; 