import Env from '@backend/env';
import { AUTOGEN_i18n_TOKEN_MAP } from '@backend/i18n/i18n-tokens.autogen';
import { Host, i18n, Performance, Provider, User } from '@core/api';
import { Inject, Service } from 'typedi';
import { ModuleEvents, Contract, I18N_PROVIDER } from '@core/api';
import { JobQueueService } from '../queue/queue.service';
import { AuthService } from '../auth/auth.service';

@Service()
export class UserEvents extends ModuleEvents {
  constructor(
    private queueService: JobQueueService,
    private authService: AuthService,
    @Inject(I18N_PROVIDER) private i18n: i18n<AUTOGEN_i18n_TOKEN_MAP>
  ) {
    super();

    // prettier-ignore
    this.events = {
      ['user.password_reset_requested']:   this.sendPasswordResetLinkEmail,
      ['user.password_changed']:           this.sendPasswordChangedNotificationEmail,
      ['user.registered']:                 this.sendUserVerificationEmail,
      ['user.invited_to_host']:            this.sendUserHostInviteEmail,
      ['user.invited_to_private_showing']: this.sendUserPrivatePerformanceInviteEmail,
      ['user.marketing_opt_in_change']:    this.sendHostEmailAboutChange,
      // ['user.invited_to_private_showing']: this.sendUserPrivatePerformanceInviteEmail
    };
  }

  async sendPasswordResetLinkEmail(ct: Contract<'user.password_reset_requested'>) {
    const user = await User.findOne({ _id: ct.user_id }, { select: ['_id', 'email_address'] });

    this.queueService.addJob('send_email', {
      subject: this.i18n.translate('@@email.user.password_reset_requested__subject', ct.__meta.locale),
      content: this.i18n.translate('@@email.user.password_reset_requested__content', ct.__meta.locale),
      from: Env.EMAIL_ADDRESS,
      to: user.email_address,
      attachments: []
    });
  }

  async sendPasswordChangedNotificationEmail(ct: Contract<'user.password_changed'>) {
    const user = await User.findOne({ _id: ct.user_id }, { select: ['_id', 'email_address'] });

    this.queueService.addJob('send_email', {
      subject: this.i18n.translate('@@email.user.password_changed__subject', ct.__meta.locale),
      content: this.i18n.translate('@@email.user.password_changed__content', ct.__meta.locale),
      from: Env.EMAIL_ADDRESS,
      to: user.email_address,
      attachments: []
    });
  }

  async sendUserVerificationEmail(ct: Contract<'user.registered'>) {
    const hash = this.authService.generateEmailVerificationHash(ct.email_address);
    const verificationUrl = `${Env.BACKEND.URL}/auth/verify-email?email_address=${ct.email_address}&hash=${hash}`;

    this.queueService.addJob('send_email', {
      subject: this.i18n.translate('@@email.user.registered__subject', ct.__meta.locale),
      content: this.i18n.translate('@@email.user.registered__content', ct.__meta.locale, {
        url: verificationUrl
      }),
      from: Env.EMAIL_ADDRESS,
      to: ct.email_address,
      attachments: []
    });
  }

  async sendUserHostInviteEmail(ct: Contract<'user.invited_to_host'>) {
    // Re_direct to frontend which will then send a request to backend host landing page
    const acceptanceUrl = `${Env.BACKEND.URL}/hosts/${ct.host_id}/invites/${ct.invite_id}`;

    const inviter = await User.findOne({ _id: ct.inviter_id }, { select: ['email_address', 'username', 'name'] });
    const invitee = await User.findOne({ _id: ct.invitee_id }, { select: ['email_address', 'username', 'name'] });
    const host = await Host.findOne({ _id: ct.host_id }, { select: ['username', 'name'] });

    this.queueService.addJob('send_email', {
      subject: this.i18n.translate('@@email.user.invited_to_host__subject', ct.__meta.locale, {
        inviter_name: inviter.name || inviter.username,
        host_name: host.username
      }),
      content: this.i18n.translate('@@email.user.invited_to_host__content', ct.__meta.locale, {
        user_name: invitee.name || invitee.username,
        url: acceptanceUrl
      }),
      from: Env.EMAIL_ADDRESS,
      to: invitee.email_address,
      attachments: []
    });
  }

  async sendUserPrivatePerformanceInviteEmail(ct: Contract<'user.invited_to_private_showing'>) {
    const user = await User.findOne({ _id: ct.user_id }, { select: ['email_address', 'username', 'name'] });
    const performance = await Performance.findOne({ _id: ct.performance_id }, { select: ['name'] });
    const host = await Host.findOne({ _id: ct.host_id }, { select: ['username', 'name'] });
    const performanceLink = `${Env.FRONTEND.URL}/${ct.__meta.locale}}/performances/${performance._id}/watch`;

    this.queueService.addJob('send_email', {
      subject: this.i18n.translate('@@email.user.invited_to_private_showing__subject', ct.__meta.locale),
      content: this.i18n.translate('@@email.user.invited_to_private_showing__content', ct.__meta.locale, {
        url: performanceLink,
        user_name: user.name || user.username,
        performance_name: performance.name,
        host_name: host.name || host.username
      }),
      from: Env.EMAIL_ADDRESS,
      to: user.email_address,
      attachments: []
    });
  }

  async sendHostEmailAboutChange(ct: Contract<'user.marketing_opt_in_change'>) {
    const user = await User.findOne({ _id: ct.user_id }, { select: ['username', 'email_address'] });
    const host = await Host.findOne({ _id: ct.host_id }, { select: ['_id', 'email_address'] });

    console.log('USER', user);
    console.log('HOST', host);
    console.log('REASON', ct.opt_out_reason);
    console.log('STATUS', ct.opt_status);

    // TODOS:
    // 1. Check if opt out or opt in
    // 2. If opt in, just send email
    // 3. If opt out, check if opt_out_reason, opt_out_reason.reason or opt_out_reason.message exist so we know what to include in the body
    // 4. Send opt out email with required information for host, depending on what was supplied

    // this.queueService.addJob('send_email', {
    //   subject: this.i18n.translate('@@email.user.marketing_opt_in_change__subject', ct.__meta.locale),
    //   content: this.i18n.translate('@@email.user.marketing_opt_in_change__content', ct.__meta.locale),
    //   from: Env.EMAIL_ADDRESS,
    //   to: user.email_address,
    //   attachments: []
    // });
  }
}
