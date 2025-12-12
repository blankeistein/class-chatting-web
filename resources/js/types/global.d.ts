import { Config } from 'ziggy-js';

declare global {
  function route(name?: string, params?: any, absolute?: boolean, config?: Config): string;
}
