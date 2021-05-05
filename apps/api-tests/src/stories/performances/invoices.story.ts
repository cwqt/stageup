// import { CurrencyCode, IHost, IPerformance, IUser, PaymentStatus, RefundReason } from '@core/interfaces';
// import { Stories } from '../../stories';
// import { UserType } from '../../environment';
// import { ProviderMap } from '../../../../../libs/shared/src/api/data-client';
// import { Connection } from 'typeorm';
// import { Invoice, User } from "../../../../../libs/shared/src/api/entities/";

// describe('As a user, I want to be able to manage my invoices', () => {
//   let user: User;
//   let providers: ProviderMap;
//   let ORM: Connection = providers['torm'].connection;
//   let invoice: Invoice;

//   it('Should create a dummy invoice to be refunded', async () => {
//     ORM.transaction(async txc => {
//         user = await txc.save(
//             new User({
//                 email_address: 'test@test.com',
//                 username: 'user1',
//                 password: 'testpass123',
//                 stripe_customer_id: '982139821'
//             })
//           )
//      });
    
//     ORM.transaction(async txc => {
//         const invoice = await txc.save(
//             new Invoice(user, 12, CurrencyCode.GBP, null)
//           )
//      });
//     });
  

//   it('Requesta a refund on an invoice', async () => {
//     await Stories.actions.users.requestInvoiceRefund({
//         invoice_id: invoice._id,
//         reason: RefundReason.Covid,
//         reason_detail: 'COVID-19'
//     });

//     expect(invoice.status).toBe(PaymentStatus.RefundPending);
//   });
    

// });