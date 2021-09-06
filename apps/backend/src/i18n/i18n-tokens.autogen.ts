// AUTO GENERATED FILE, CHANGES WILL BE LOST -------------------
// to regenerate run:
//   npm run generate:xlf
// -------------------------------------------------------------
export type AUTOGEN_i18n_TOKEN_MAP = {
  ['@@login.password_incorrect']: never;
  ['@@user.not_found']: never;
  ['@@error.not_a_video']: never;
  ['@@error.email_already_in_use']: never;
  ['@@error.user_has_no_claim']: never;
  ['@@error.too_many_thumbnails']: never;
  ['@@error.publicity_period_outside_ticket_period']: never;
  ['@@error.already_following']: never;
  ['@@error.invalid_rating']: never;
  ['@@error.no_rating_exists']: never;
  ['@@error.stream_compliance_not_accepted']: never;
  ['@@onboarding.steps_invalid']: never;
  ['@@onboarding.step_is_invalid']: never;
  ['@@host.example_patron_tier_name']: never;
  ['@@host.example_patron_tier_description']: never;
  ['@@host.requires_stripe_connected']: never;
  ['@@host.invoice_csv.invoice_id']: never;
  ['@@host.invoice_csv.performance_name']: never;
  ['@@host.invoice_csv.ticket_type']: never;
  ['@@host.invoice_csv.purchased_at']: never;
  ['@@host.invoice_csv.amount']: never;
  ['@@host.invoice_csv.net_amount']: never;
  ['@@host.invoice_csv.currency']: never;
  ['@@host.invoice_csv.status']: never;
  ['@@host.invoice_pdf.invoice_id']: never;
  ['@@host.invoice_pdf.performance_name']: never;
  ['@@host.invoice_pdf.ticket_type']: never;
  ['@@host.invoice_pdf.purchased_at']: never;
  ['@@host.invoice_pdf.amount']: never;
  ['@@host.invoice_pdf.net_amount']: never;
  ['@@host.invoice_pdf.currency']: never;
  ['@@host.invoice_pdf.status']: never;
  ['@@host.invoice_pdf.created_at']: never;
  ['@@host.invoice_pdf.total_rows']: never;
  ['@@performance.cannot_delete_live']: never;
  ['@@performance.cannot_delete_after_occurrence']: never;
  ['@@performance.cannot_cancel_live']: never;
  ['@@performance.cannot_cancel_after_occurrence']: never;
  ['@@payment_status.created']: never;
  ['@@payment_status.paid']: never;
  ['@@payment_status.fufilled']: never;
  ['@@payment_status.refunded']: never;
  ['@@payment_status.refund_pending']: never;
  ['@@payment_status.refund_denied']: never;
  ['@@ticket_type.paid']: never;
  ['@@ticket_type.free']: never;
  ['@@ticket_type.dono']: never;
  ['@@stripe.origin_url_not_matched']: never;
  ['@@refunds.no_invoices_found']: never;
  ['@@refunds.refund_already_outstanding']: never;
  ['@@host_marketing_opt_out.too_cluttered']: never;
  ['@@host_marketing_opt_out.too_frequent']: never;
  ['@@host_marketing_opt_out.not_relevant']: never;
  ['@@host_marketing_opt_out.didnt_sign_up']: never;
  ['@@email.user.refund_initiated__content']:
    | 'user_username'
    | 'host_name'
    | 'invoice_id'
    | 'invoice_amount'
    | 'performance_name'
    | 'card_brand'
    | 'last_4';
  ['@@email.user.refund_initiated__subject']: 'host_name' | 'performance_name';
  ['@@email.host.refund_initiated__content']: 'host_name' | 'performance_name' | 'invoice_id' | 'invoice_amount';
  ['@@email.host.refund_initiated__subject']: 'user_username' | 'performance_name';
  ['@@email.host.refund_bulk_initiated_subject']: 'refund_quantity';
  ['@@email.host.refund_bulk_initiated_content']: 'host_name' | 'refund_quantity' | 'invoices_total';
  ['@@email.user.refund_refunded__subject']: 'performance_name';
  ['@@email.user.refund_refunded__content']:
    | 'user_username'
    | 'host_name'
    | 'invoice_id'
    | 'invoice_amount'
    | 'performance_name'
    | 'refund_reason'
    | 'card_brand'
    | 'last_4';
  ['@@email.host.refund_refunded__subject']: 'user_username' | 'performance_name' | 'invoice_id';
  ['@@email.host.refund_refunded__content']: 'host_name' | 'user_username' | 'performance_name' | 'invoice_amount';
  ['@@email.refund_requested__subject']: 'host_name';
  ['@@email.refund_requested__content']: 'host_name' | 'invoice_id' | 'performance_name' | 'purchase_date' | 'amount';
  ['@@email.host_refund_requested_confirmation__subject']: 'performance_name' | 'user_username';
  ['@@email.host_refund_requested_confirmation__content']:
    | 'host_name'
    | 'user_username'
    | 'user_email_address'
    | 'performance_name'
    | 'invoice_id'
    | 'performance_name'
    | 'purchase_date'
    | 'amount'
    | 'invoice_dashboard_url';
  ['@@email.host.invoice_pdf__subject']: never;
  ['@@email.host.invoice_pdf__content']: never;
  ['@@email.host.invoice_csv__filename']: never;
  ['@@email.host.invoice_csv__subject']: never;
  ['@@email.host.invoice_csv__content']: never;
  ['@@email.host.invoice_pdf__filename']: never;
  ['@@email.test.send_email__subject']: never;
  ['@@email.test.send_email__content']: 'username' | 'url';
  ['@@email.user.registered__subject']: never;
  ['@@email.user.registered__content']: 'url' | 'url';
  ['@@email.user.invited_to_host__subject']: 'host_name' | 'inviter_name';
  ['@@email.user.invited_to_host__content']: 'user_name' | 'url' | 'url';
  ['@@email.user.invited_to_private_showing__subject']: never;
  ['@@email.user.invited_to_private_showing__content']: 'user_name' | 'performance_name' | 'host_name' | 'url' | 'url';
  ['@@email.ticket.purchased_current__subject']: 'performance_name';
  ['@@email.ticket.purchased_current__content']:
    | 'user_name'
    | 'ticket_name'
    | 'performance_name'
    | 'amount'
    | 'url'
    | 'receipt_url'
    | 'receipt_url';
  ['@@email.ticket.purchased_future__subject']: 'performance_name';
  ['@@email.ticket.purchased_future__content']:
    | 'user_name'
    | 'performance_name'
    | 'amount'
    | 'publicity_period_start'
    | 'receipt_url'
    | 'receipt_url'
    | 'url';
  ['@@email.user.patronage_started__subject']: 'tier_name';
  ['@@email.user.patronage_started__content']: 'user_name' | 'host_name' | 'amount' | 'date_ordinal' | 'tos_url';
  ['@@email.host.patronage_started__subject']: 'tier_name';
  ['@@email.host.patronage_started__content']: 'host_name' | 'user_username' | 'tier_name' | 'amount';
  ['@@email.user.password_reset_requested__subject']: never;
  ['@@email.user.password_reset_requested__content']: 'user_name' | 'password_reset_url' | 'password_reset_url';
  ['@@email.user.password_changed__subject']: never;
  ['@@email.user.password_changed__content']: never;
  ['@@email.subscriber_notify_tier_deleted__subject']: never;
  ['@@email.subscriber_notify_tier_deleted__content']: 'user_username' | 'host_username' | 'tier_name' | 'sub_id';
  ['@@email.user_unsubscribed_from_patron_tier__subject']: never;
  ['@@email.user_unsubscribed_from_patron_tier__content']: 'user_username' | 'host_username' | 'tier_name';
  ['@@email.user.one_day_performance_reminder__subject']: 'performance_name';
  ['@@email.user.one_day_performance_reminder__content']: 'user_username' | 'performance_name' | 'premier_time';
  ['@@email.user.fifteen_minute_performance_reminder__subject']: never;
  ['@@email.user.fifteen_minute_performance_reminder__content']:
    | 'user_username'
    | 'performance_name'
    | 'premier_time'
    | 'url';
  ['@@email.performance.cancelled_notify_host__subject']: 'performance_name';
  ['@@email.performance.cancelled_notify_host__content']:
    | 'host_name'
    | 'performance_name'
    | 'performance_premiere_date';
  ['@@email.performance.softDeleted_notify_host__subject']: 'performance_name';
  ['@@email.performance.softDeleted_notify_host__content']:
    | 'host_name'
    | 'performance_name'
    | 'performance_premiere_date';
  ['@@email.performance.removed_notify_user__subject']: 'performance_name';
  ['@@email.performance.removed_notify_user__content']:
    | 'user_username'
    | 'host_name'
    | 'performance_name'
    | 'ticket_purchase_date'
    | 'invoice_id'
    | 'ticket_amount'
    | 'card_brand'
    | 'last_4';
  ['@@email.user.opting_in_to_marketing__subject']: never;
  ['@@email.user.opting_in_to_marketing__content']: 'host_name' | 'user_name' | 'user_email';
  ['@@email.user.opting_out_of_marketing__subject']: never;
  ['@@email.user.opting_out_of_marketing__content']: 'user_name' | 'user_email' | 'opt_out_reason' | 'opt_out_message';
  ['@@error.internal_server_error']: never;
  ['@@error.missing_translation']: never;
  ['@@error.missing_permissions']: never;
  ['@@error.not_found']: never;
  ['@@error.no_such_route']: never;
  ['@@error.not_member']: never;
  ['@@error.duplicate']: never;
  ['@@error.in_use']: never;
  ['@@error.invalid']: never;
  ['@@error.code']: never;
  ['@@error.unknown']: never;
  ['@@error.no_session']: never;
  ['@@error.admin_only']: never;
  ['@@error.missing_field']: never;
  ['@@error.not_verified']: never;
  ['@@error.forbidden']: never;
  ['@@error.not_implemented']: never;
  ['@@error.incorrect']: never;
  ['@@error.missing_body']: never;
  ['@@error.locked']: never;
  ['@@validation.not_allowed']: never;
  ['@@validation.invalid']: never;
  ['@@validation.too_long']: never;
  ['@@validation.too_short']: never;
  ['@@validation.invalid_email']: never;
  ['@@validation.invalid_phone_number']: never;
  ['@@validation.not_hmrc_number']: never;
  ['@@validation.invalid_vat_number']: never;
  ['@@validation.invalid_url']: never;
  ['@@validation.invalid_facebook_url']: never;
  ['@@validation.invalid_instagram_url']: never;
  ['@@validation.invalid_linkedin_url']: never;
  ['@@validation.invalid_twitter_url']: never;
  ['@@validation.invalid_pinterest_url']: never;
  ['@@validation.invalid_youtube_url']: never;
};
