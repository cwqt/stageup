import { AppCache } from './providers/redis.provider';
import Mux from '@mux/mux-node';
import { RedisStore } from 'connect-redis';
import { Tunnel } from 'localtunnel';
import { RedisClient } from 'redis';
import { Stripe } from 'stripe';
import { Token } from 'typedi';
import { Connection } from 'typeorm';
import { i18n, Mail, Provider } from '../';
import { Blobs } from './providers/blob.provider';
import { EventBus } from './providers/event-bus.provider';
import { Logger } from './providers/logging.provider';
import { SSE } from './providers/sse.provider';

export const EMAIL_PROVIDER = new Token<Mail>('EMAIL_PROVIDER');
export const BLOB_PROVIDER = new Token<Blobs>('BLOB_PROVIDER');
export const EVENT_BUS_PROVIDER = new Token<EventBus>('EVENT_BUS_PROVIDER');
export const HTTP_TUNNEL_PROVIDER = new Token<Tunnel>('HTTP_TUNNEL_PROVIDER');
export const LOGGING_PROVIDER = new Token<Logger>('LOGGING_PROVIDER');
export const MUX_PROVIDER = new Token<Mux>('MUX_PROVIDER');
export const POSTGRES_PROVIDER = new Token<Connection>('POSTGRES_PROVIDER');
export const CACHE_PROVIDER = new Token<AppCache>('CACHE_PROVIDER');
export const SSE_HUB_PROVIDER = new Token<SSE>('SSE_HUB_PROVIDER');
export const STORE_PROVIDER = new Token<RedisStore>('STORE_PROVIDER');
export const STRIPE_PROVIDER = new Token<Stripe>('STRIPE_PROVIDER');
export const I18N_PROVIDER = new Token<i18n<any>>('I18N_PROVIDER');
