// bus.subscribe("test.send_email",                   handlers.sendTestEmail);

//   sendTestEmail = async (ct: Contract<'test.send_email'>) => {
//     const user = await User.findOne({ _id: ct.user_id }, { select: ['email_address', 'username', 'name'] });
//     this.queues.send_email.add({
//       subject: this.providers.i18n.translate('@@email.test.send_email__subject', ct.__meta.locale),
//       content: this.providers.i18n.translate('@@email.test.send_email__content', ct.__meta.locale, {
//         username: user.username,
//         url: Env.FRONTEND.URL
//       }),
//       from: Env.EMAIL_ADDRESS,
//       to: user.email_address,
//       attachments: []
//     });
//   };
