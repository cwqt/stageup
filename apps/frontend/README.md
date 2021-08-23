# **Frontend**

StageUp's Frontend uses Angular 11.

## Angular CLI (aka **ng-cli) commands within Nx**

To generate boilerplate angular components and services you can use the following commands:

```
nx generate @nrwl/angular:component COMPONENT_NAME 
--project=frontend --module=app.module

nx generate @nrwl/angular:service SERVICE_NAME
--project=frontend ---module=app.module
```

These commands will generate boilerplate TS, SCSS & HTML files for the component or service. 

- "--project=frontend adds these files within "apps/frontend"
- "--module=app.module" automatically adds to the "app.module.ts" file rather than the "ui-lib.module.ts" file. This just saves you having to go to the file and import it yoursel (e.g. 'import { component } from "component-path')

## **nginx**

'nginx.conf.template' contains configurations for a webserver. The variable `API_HOST` needs to be set to the hostname of backend URL to forward api requests to, e.g. `backend-su-193-uuid-nw.a.run.app`