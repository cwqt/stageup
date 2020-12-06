import { Type } from "@angular/core";
import { Routes, Route } from "@angular/router";
import { Y } from "@cxss/interfaces";

export default class AppRouter {
  private routes: Routes;
  private routers: AppRouter[];
  private root: string;
  private parent: AppRouter;

  constructor(rootRoute?: string, parentRouter?: AppRouter) {
    this.routes = [];
    this.routers = [];
    this.root = rootRoute ? `${rootRoute}` : "";
    this.parent = parentRouter;
  }

  log() {
    console.log(this);
    return this;
  }

  register(
    path: string,
    component: Type<any>,
    guard?: any,
    registerIf: boolean = true
  ): AppRouter {
    if (registerIf) {
      const route: Route = {
        path: path,
        component: component,
        canActivate: guard ? [guard] : [],
      };
      this.routes.push(route);
      return this;
    }
  }

  pushRouter(f: (r: this) => AppRouter): AppRouter {
    const router = f(this);
    const r = new AppRouter(router.routes[router.routes.length - 1].path, this);
    this.routers.push(r);
    return r;
  }

  popRouter(): AppRouter | null {
    if (!this.parent) throw new Error(`No parent to pop from`);
    return this.parent;
  }

  apply(): Routes {
    return Y((r: (x: AppRouter) => Routes) => (n) => {
      return [
        ...n.routes.map((rs) => ({
          ...rs,
          children: n.routers.reduce((acc, curr) => {
            return curr.root == rs.path ? [...acc, ...r(curr)] : [];
          }, []),
        })),
      ];
    })(this);
  }
}
