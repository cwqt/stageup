import { AfterViewInit, Component, EventEmitter, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IHostStub, IPatronSubscription, IPatronTier, PurchaseableType } from '@core/interfaces';
import { PaymentMethodComponent } from '@frontend/components/payment-method/payment-method.component';
import { PaymentIntent, StripeError } from '@stripe/stripe-js';
import { cachize, createICacheable, ICacheable } from 'apps/frontend/src/app/app.interfaces';
import { PatronageService } from 'apps/frontend/src/app/services/patronage.service';
import { ToastService } from 'apps/frontend/src/app/services/toast.service';
import { UiDialogButton } from 'apps/frontend/src/app/ui-lib/dialog/dialog-buttons/dialog-buttons.component';
import { IUiDialogOptions, ThemeKind } from 'apps/frontend/src/app/ui-lib/ui-lib.interfaces';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-become-patron-dialog',
  templateUrl: './become-patron-dialog.component.html',
  styleUrls: ['./become-patron-dialog.component.scss']
})
export class BecomePatronDialogComponent implements OnInit, AfterViewInit, IUiDialogOptions {
  // Only using this to collect a paymentIntent _id
  @ViewChild('paymentMethod') paymentMethod: PaymentMethodComponent;
  subscription: ICacheable<IPatronSubscription> = createICacheable();

  buttons: UiDialogButton[];
  submit: EventEmitter<void> = new EventEmitter();
  cancel: EventEmitter<void> = new EventEmitter();

  private _unsubscribe = new Subject<void>();

  constructor(
    private toastService: ToastService,
    private patronageService: PatronageService,
    public ref: MatDialogRef<BecomePatronDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { tier: IPatronTier; host: IHostStub }
  ) {}

  ngOnInit(): void {
    this.buttons = [
      new UiDialogButton({
        label: 'Cancel',
        kind: ThemeKind.Secondary,
        callback: () => this.cancel.emit()
      }),
      new UiDialogButton({
        label: 'Become a Patron',
        kind: ThemeKind.Primary,
        disabled: true,
        callback: () =>
          cachize(
            this.patronageService.subscribe(this.data.tier._id, {
              payment_method_id: this.paymentMethod.selectionModel.selected[0]._id,
              purchaseable_type: PurchaseableType.PatronTier,
              purchaseable_id: this.data.tier._id,
              options: {}
            }),
            this.subscription
          )
            .then(() => {
              this.toastService.emit(`Successfully subscribed to ${this.data.tier.name}!`, ThemeKind.Accent);
            })
            .catch(err => {
              this.toastService.emit(`Failed to subscribe to tier, please try again later`, ThemeKind.Danger);
            })
            .finally(() => {
              this.ref.close();
            })
      })
    ];
  }

  ngAfterViewInit(): void {
    // Bind disabled state to payment selectionModel
    this.paymentMethod.selectionModel.changed.pipe(takeUntil(this._unsubscribe)).subscribe(v => {
      this.buttons[1].disabled = this.paymentMethod.selectionModel.hasValue() ? false : true;
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
