import { Type } from '@angular/core';
import { Routes } from "@angular/router";

export default class AppRouter {
    routes:Routes;
  
    constructor() {}
  
    register(path:string, component:Type<any>, guard?:any, registerIf:boolean=true) {
      if(registerIf) {
        this.routes.push({
          path: path,
          component: component,
          canActivate: guard ? [guard] : []
        })  
      }
    }
  }
  