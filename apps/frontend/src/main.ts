// Only import the locales we actually use
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import 'moment/locale/en-gb';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.is_deployed) enableProdMode();

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch(err => console.error(err));
