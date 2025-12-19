import { Config } from 'ziggy-js';

declare global {
  function route(name?: string, params?: any, absolute?: boolean, config?: Config): string;
}

export type AuthProps = {
  auth: {
    user: {
      id: number;
      name: string;
      email: string;
      role: string;
      image: string;
      notifications: any[];
      unread_notifications_count: number;
    } | null;
  }
}