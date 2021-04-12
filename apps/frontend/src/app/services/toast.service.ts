import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { MatSnackBar, MatSnackBarConfig, MatSnackBarDismiss } from '@angular/material/snack-bar';
import { delay, filter, map, take, takeUntil, tap } from 'rxjs/operators';
import { ThemeKind } from '../ui-lib/ui-lib.interfaces';

export interface ToastQueueItem {
  message: string;
  beingDispatched: boolean;
  kind: ThemeKind;
  configParams?: MatSnackBarConfig;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService implements OnDestroy {
  private readonly toastQueue = new BehaviorSubject<ToastQueueItem[]>([]);
  private readonly toastQueue$ = this.toastQueue.asObservable();
  private readonly ngDestroy = new Subject();

  constructor(private matSnackBar: MatSnackBar) {
    /* Dispatches all queued snack bars one by one */
    this.toastQueue$
      .pipe(
        filter(queue => queue.length > 0 && !queue[0].beingDispatched),
        tap(() => {
          const updatedQueue = this.toastQueue.value;
          updatedQueue[0].beingDispatched = true;
          this.toastQueue.next(updatedQueue);
        }),
        map(queue => queue[0]),
        takeUntil(this.ngDestroy)
      )
      .subscribe(toastItem => this.showToast(toastItem.message, toastItem.kind, toastItem.configParams));
  }

  public ngOnDestroy() {
    this.toastQueue.next([]);
    this.toastQueue.complete();
    this.ngDestroy.next();
    this.ngDestroy.complete();
  }

  public emit(message: string, kind: ThemeKind = ThemeKind.Primary, configParams?: MatSnackBarConfig) {
    this.toastQueue.next(this.toastQueue.value.concat([{ message, configParams, kind, beingDispatched: false }]));
  }

  private showToast(message: string, kind:ThemeKind, configParams?: MatSnackBarConfig) {
    const duration = this.getDuration(configParams);
    this.removeDismissedToast(
      this.matSnackBar
        .open(message, 'OK', {
          duration,
          verticalPosition: 'bottom',
          horizontalPosition: 'right',
          politeness: 'assertive',
          panelClass: `ui-toast--${kind}`
        })
        .afterDismissed()
    );
  }

  /* Remove dismissed toast from queue and triggers another one to appear */
  private removeDismissedToast(dismissed: Observable<MatSnackBarDismiss>) {
    dismissed.pipe(delay(10), take(1)).subscribe(() => {
      const updatedQueue = this.toastQueue.value;
      if (updatedQueue[0].beingDispatched) updatedQueue.shift();
      this.toastQueue.next(updatedQueue);
    });
  }

  private getDuration(configParams?: MatSnackBarConfig): number {
    if (configParams && configParams.duration) return configParams.duration;
    else return 2500;
  }
}
