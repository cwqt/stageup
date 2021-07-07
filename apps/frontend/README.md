# Frontend

StageUp Core Frontend using Angular 11

## ng-cli commands within Nx

- **Component**: `nx g @nrwl/angular:component components/COMPONENT_NAME --project=frontend --module=app.module`
- **Service**: `nx g @nrwl/angular:service services/SERVICE_NAME --project=frontend ---module=app.module`

## nginx

Contains configurations for webserver, uses a template file for interpolating environment variables.

- `API_HOST`: hostname for backend URL to forward api requests, e.g. `backend-su-193-uuid-nw.a.run.app`
