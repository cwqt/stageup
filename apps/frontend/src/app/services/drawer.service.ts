import { Injectable } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { BehaviorSubject, concat, merge, Observable, Subject, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

export enum DrawerKey {
  HostPerformance
}

export interface IDrawerData {
  key: DrawerKey;
  data: any;
}

@Injectable({
  providedIn: 'root'
})
export class DrawerService {
  $drawer: BehaviorSubject<MatDrawer> = new BehaviorSubject(null);
  $drawerData: BehaviorSubject<IDrawerData> = new BehaviorSubject({ key: null, data: null });

  // Emits value on instant of opened, and instant of fully closed
  $drawerOpen: Subject<boolean> = new Subject();
  
  // Emits value on instant of state change
  $drawerOpenInstant: Subject<boolean> = new Subject();

  private _subOpenState: Subscription;
  private _subInstantOpenState: Subscription;

  constructor() {}

  get drawer() {
    return this.$drawer.value;
  }
  get drawerData() {
    return this.$drawerData.value;
  }

  setDrawer(drawer: MatDrawer) {
    // Unsubscribe from old drawer & re-sub to new one - keeping the subject
    // alive at all times, piping new values into same subject
    this._subInstantOpenState?.unsubscribe();
    this._subOpenState?.unsubscribe();

    this.$drawer.next(drawer);

    this._subInstantOpenState = merge(
      drawer.openedStart.pipe(map(v => true)),
      drawer.closedStart.pipe(map(v => false))
    ).subscribe(this.$drawerOpenInstant);

    this._subOpenState = merge(
      drawer.openedChange,
      drawer.openedStart.pipe(map(v => true))
    ).subscribe(this.$drawerOpen);
  }

  setDrawerState(data: IDrawerData) {
    this.$drawerData.next(data);
  }
}
