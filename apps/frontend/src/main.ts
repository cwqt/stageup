// Only import the locales we actually use
import 'moment/locale/en-gb';

import { enableProdMode, Injector } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment as env } from './environments/environment';
import { Environment } from '@core/interfaces';

if (env.environment == Environment.Production || env.environment == Environment.Staging) enableProdMode();

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch(err => console.error(err));

