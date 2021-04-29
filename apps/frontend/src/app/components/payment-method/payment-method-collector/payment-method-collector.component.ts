import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { IPaymentMethodStub, ISOCountryCode } from '@core/interfaces';
import { createICacheable, ICacheable } from '@frontend/app.interfaces';
import { MyselfService } from '@frontend/services/myself.service';
import { UiField, UiForm } from '@frontend/ui-lib/form/form.interfaces';
import { PaymentMethod, StripeError } from '@stripe/stripe-js';
import { whereAlpha3 } from 'iso-3166-1';
import { merge, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CardComponent } from './card/card.component';

@Component({
  selector: 'app-payment-method-collector',
  templateUrl: './payment-method-collector.component.html',
  styleUrls: ['./payment-method-collector.component.scss']
})
export class PaymentMethodCollectorComponent implements OnInit, AfterViewInit {
  @ViewChild('card') card: CardComponent;
  @Input() smaller: boolean = false;
  @Output() addedMethod: EventEmitter<IPaymentMethodStub> = new EventEmitter();
  @Output() cancelAdd: EventEmitter<void> = new EventEmitter();

  entireFormIsValid: Observable<boolean>;
  methods: ICacheable<IPaymentMethodStub[]> = createICacheable();
  billingDetailsForm: UiForm;
  createdPaymentMethod: ICacheable<{ paymentMethod: PaymentMethod; error: StripeError }> = createICacheable();

  constructor(private myselfService: MyselfService) {}

  ngOnInit(): void {
    this.billingDetailsForm = new UiForm({
      fields: {
        city: UiField.Text({
          label: 'City',
          hint: 'City/District/Suburb/Town/Village',
          validators: [{ type: 'required' }, { type: 'maxlength', value: 128 }],
          hide_footer: this.smaller
        }),
        line1: UiField.Text({
          label: 'Address Line 1',
          hint: 'Street address/PO Box/Company name',
          validators: [{ type: 'required' }, { type: 'maxlength', value: 128 }],
          hide_footer: this.smaller
        }),
        line2: UiField.Text({
          label: 'Address Line 2',
          hint: 'Apartment/Suite/Unit/Building',
          validators: [{ type: 'maxlength', value: 128 }],
          hide_footer: this.smaller
        }),
        // TODO: add different countries when going global
        // country: UiField.Select({
        //   label: 'Country',
        //   has_search: true,
        //   // Stripe uses ISO-3166-Alpha-2
        //   values: Object.keys(ISOCountryCode).reduce((acc, curr) => {
        //     const d = whereAlpha3(curr);
        //     if (!d) return acc;
        //     acc.set(d.alpha2, { label: d.country });
        //     return acc;
        //   }, new Map()),
        //   validators: [{ type: 'required' }]
        // }),
        postal_code: UiField.Text({
          label: 'Postcode',
          validators: [{ type: 'required' }, { type: 'maxlength', value: 128 }],
          width: 6,
          hide_footer: this.smaller
        }),
        state: UiField.Text({
          label: 'County',
          hint: 'State/County/Province/Region',
          validators: [{ type: 'required' }, { type: 'maxlength', value: 128 }],
          width: 6,
          hide_footer: this.smaller
        })
      },
      resolvers: {
        output: async () => {}
      }
    });
  }

  ngAfterViewInit(): void {
    this.entireFormIsValid = merge(this.billingDetailsForm.group.valueChanges, this.card.onChange).pipe(
      map(() => {
        return this.billingDetailsForm.group.valid && this.card.valid ? true : false;
      })
    );
  }

  async createPaymentMethod() {
    this.createdPaymentMethod.loading = true;
    this.billingDetailsForm.group.disable();

    try {
      // TODO: add different countries when going global
      const res = await this.card.createPaymentMethod({ ...this.billingDetailsForm.group.value, country: 'GB' });
      if (res.error) {
        this.createdPaymentMethod.error = res.error.message;
      } else {
        const method = await this.myselfService.addCreatedPaymentMethod({
          stripe_method_id: res.paymentMethod.id,
          is_primary: false
        });

        this.addedMethod.emit(method);
        this.billingDetailsForm.group.reset();
      }
    } catch (error) {
      this.createdPaymentMethod.error = (error as HttpErrorResponse).message;
    } finally {
      this.createdPaymentMethod.loading = false;
      this.billingDetailsForm.group.enable();
    }
  }
}
