import { Auth, AuthStrategy, AuthStratReturn, Host, MapAccessor, NUUIDMap, User, UserHostInfo } from '@core/api';
import { Environment, hasRequiredHostPermission, HostPermission, IHost } from '@core/interfaces';
import Env from '../../env';

const isLoggedIn: AuthStrategy = async (req): Promise<AuthStratReturn> => {
  if (!req.session.user) {
    return [false, {}, '@@error.no_session'];
  }

  return [true, {}];
};

const isOurself: AuthStrategy = async (req): Promise<AuthStratReturn> => {
  const [isAuthorised, _, reason] = await isLoggedIn(req);
  if (!isAuthorised) return [isAuthorised, _, reason];

  const user = await User.findOne({ _id: req.params.uid });
  if (user._id !== req.session.user._id) {
    return [false, {}, '@@error.no_session'];
  }

  return [true, { user }];
};

const isMemberOfAnyHost: AuthStrategy = async (req, map): Promise<AuthStratReturn> => {
  const [isAuthorised, _, reason] = await isLoggedIn(req);
  if (!isAuthorised) return [isAuthorised, _, reason];

  const user = await User.findOne({
    relations: ['host'],
    where: {
      _id: req.session.user._id
    },
    select: {
      host: {
        _id: true
      }
    }
  });

  if (!user.host) return [false, {}, '@@error.not_member'];
  return [true, { user }];
};

const isMemberOfHost = (mapAccessor?: MapAccessor, passedMap?: NUUIDMap): AuthStrategy => {
  return async (req, map): Promise<AuthStratReturn> => {
    const [isAuthorised, _, reason] = await isLoggedIn(req);
    if (!isAuthorised) return [isAuthorised, _, reason];

    const hostId = mapAccessor ? mapAccessor(passedMap || map) : req.params.hid;

    const uhi = await UserHostInfo.findOne({
      relations: ['user', 'host'],
      where: {
        user: {
          _id: req.session.user._id
        },
        host: {
          _id: hostId
        }
      },
      select: { permissions: true, _id: true, user: { _id: true }, host: { _id: true } }
    });

    if (!uhi) return [false, {}, '@@error.not_member'];
    if (uhi && uhi.permissions == HostPermission.Expired) return [false, {}, '@@error.not_member'];

    return [true, { uhi }];
  };
};

const hasHostPermission = (permission: HostPermission, mapAccessor?: MapAccessor): AuthStrategy => {
  return async (req, map): Promise<AuthStratReturn> => {
    // Pass this NUUIDMap down to the isMemberOfHost Auth Strategy
    const [isMember, passthru, reason] = await isMemberOfHost(mapAccessor, map)(req);
    if (!isMember) return [false, {}, reason];

    // Highest Perms (Owner)  = "host_owner"
    // Lowest Perfs (Pending) = "host_pending"
    if (hasRequiredHostPermission(passthru.uhi.permissions, permission)) {
      return [false, {}, '@@error.missing_permissions'];
    }

    return [true, passthru];
  };
};

const hasSpecificHostPermission = (permission: HostPermission): AuthStrategy => {
  return async (req, providers): Promise<AuthStratReturn> => {
    const [isMember, passthru, reason] = await isMemberOfHost()(req, providers);
    if (!isMember) return [false, {}, reason];

    if (passthru.uhi.permissions !== permission) {
      return [false, {}, '@@error.missing_permissions'];
    }

    return [true, { user: passthru.user }];
  };
};

const isSiteAdmin: AuthStrategy = async (req, providers): Promise<AuthStratReturn> => {
  const [isAuthorised, _, reason] = await isLoggedIn(req, providers);
  if (!isAuthorised) {
    return [isAuthorised, _, reason];
  }

  if (!req.session.user.is_admin) {
    return [false, {}, '@@error.admin_only'];
  }

  return [true, {}];
};

const hostIsOnboarded = (mapAccessor?: MapAccessor): AuthStrategy => {
  return async (req, map): Promise<AuthStratReturn> => {
    const hostId: IHost['_id'] = mapAccessor ? await mapAccessor(map) : req.params.hid;
    if (!hostId) return [false, {}, '@@error.missing_field'];

    // Find if the host is onboarded or not
    const host = await Host.findOne(
      {
        _id: hostId
      },
      {
        select: {
          is_onboarded: true
        }
      }
    );

    if (!host) return [false, {}, '@@error.not_found'];
    if (!host.is_onboarded) return [false, {}, '@@error.not_verified'];

    return [true, { host }];
  };
};

const userEmailIsVerified = (mapAccessor?: MapAccessor): AuthStrategy => {
  return async (req, map): Promise<AuthStratReturn> => {
    const userId = mapAccessor ? await mapAccessor(map) : req.params.uid;
    if (!userId) return [false, {}, '@@error.missing_field'];

    const user = await User.findOne(
      {
        _id: userId
      },
      { select: { is_verified: true } }
    );
    if (!user) return [false, {}, '@@error.not_found'];
    if (!user.is_verified) return [false, {}, '@@error.not_verified'];

    return [true, {}];
  };
};

const isEnv = (env: Environment): AuthStrategy => {
  return async (req): Promise<AuthStratReturn> => {
    if (!Env.isEnv(env)) return [false, {}, '@@error.unknown'];
    return [true, {}];
  };
};

export default {
  isEnv,
  isOurself,
  isLoggedIn,
  isMemberOfHost,
  isMemberOfAnyHost,
  hostIsOnboarded,
  userEmailIsVerified,
  hasHostPermission,
  hasSpecificHostPermission,
  isSiteAdmin,
  ...Auth
};
