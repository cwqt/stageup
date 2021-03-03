import Env from '../../env';
import { Environment, ErrCode, HostPermission, IHost, hasRequiredHostPermission } from '@core/interfaces';
import { Auth, AuthStrategy, AuthStratReturn, MapAccessor, NUUIDMap, User, UserHostInfo, Host } from '@core/shared/api';

const isFromService: AuthStrategy = async (req, dc): Promise<AuthStratReturn> => {
  if (!req.headers.authorization) return [false, {}];

  // Check bearer authentication matches internally known key
  const auth = Buffer.from(req.headers.authorization.split(' ')[1], 'base64').toString();
  if (auth != `service:${Env.INTERNAL_KEY}`) {
    return [false, {}];
  }

  return [true, {}];
};

const isLoggedIn: AuthStrategy = async (req, dc): Promise<AuthStratReturn> => {
  if (!req.session.user) {
    return [false, {}, ErrCode.NO_SESSION];
  }

  return [true, {}];
};

const isOurself: AuthStrategy = async (req, dc): Promise<AuthStratReturn> => {
  const [isAuthorised, _, reason] = await isLoggedIn(req, dc);
  if (!isAuthorised) {
    return [isAuthorised, _, reason];
  }

  const user = await User.findOne({ _id: req.params.uid });
  if (user._id !== req.session.user._id) {
    return [false, {}, ErrCode.NO_SESSION];
  }

  return [true, { user }];
};

const isMemberOfHost = (mapAccessor?: MapAccessor, passedMap?: NUUIDMap): AuthStrategy => {
  return async (req, dc, map): Promise<AuthStratReturn> => {
    const [isAuthorised, _, reason] = await isLoggedIn(req, dc);
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

    if (!uhi) return [false, {}, ErrCode.NOT_MEMBER];
    if (uhi && uhi.permissions == HostPermission.Expired) return [false, {}, ErrCode.NOT_MEMBER];

    return [true, { uhi }];
  };
};

const hasHostPermission = (permission: HostPermission, mapAccessor?: MapAccessor): AuthStrategy => {
  return async (req, dc, map): Promise<AuthStratReturn> => {
    // Pass this NUUIDMap down to the isMemberOfHost Auth Strategy
    const [isMember, passthru, reason] = await isMemberOfHost(mapAccessor, map)(req, dc);
    if (!isMember) return [false, {}, reason];

    // Highest Perms (Owner)  = "host_owner"
    // Lowest Perfs (Pending) = "host_pending"
    if(hasRequiredHostPermission(passthru.uhi.permissions, permission)) {
      return [false, {}, ErrCode.MISSING_PERMS];
    }

    return [true, passthru];
  };
};

const hasSpecificHostPermission = (permission: HostPermission): AuthStrategy => {
  return async (req, dc): Promise<AuthStratReturn> => {
    const [isMember, passthru, reason] = await isMemberOfHost()(req, dc);
    if (!isMember) return [false, {}, reason];

    if (passthru.uhi.permissions !== permission) {
      return [false, {}, ErrCode.MISSING_PERMS];
    }

    return [true, { user: passthru.user }];
  };
};

const isSiteAdmin: AuthStrategy = async (req, dc): Promise<AuthStratReturn> => {
  const [isAuthorised, _, reason] = await isLoggedIn(req, dc);
  if (!isAuthorised) {
    return [isAuthorised, _, reason];
  }

  if (!req.session.user.is_admin) {
    return [false, {}, ErrCode.NOT_ADMIN];
  }

  return [true, {}];
};

const hostIsOnboarded = (mapAccessor?: MapAccessor): AuthStrategy => {
  return async (req, dc, map): Promise<AuthStratReturn> => {
    const hostId: IHost['_id'] = mapAccessor ? await mapAccessor(map) : req.params.hid;
    if (!hostId) return [false, {}, ErrCode.MISSING_FIELD];

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

    if (!host) return [false, {}, ErrCode.NOT_FOUND];
    if (!host.is_onboarded) return [false, {}, ErrCode.NOT_VERIFIED];

    return [true, { host }];
  };
};

const userEmailIsVerified = (mapAccessor?: MapAccessor): AuthStrategy => {
  return async (req, dc, map): Promise<AuthStratReturn> => {
    const userId = mapAccessor ? await mapAccessor(map) : req.params.uid;
    if (!userId) return [false, {}, ErrCode.MISSING_FIELD];

    const user = await User.findOne(
      {
        _id: userId
      },
      { select: { is_verified: true } }
    );
    if (!user) return [false, {}, ErrCode.NOT_FOUND];
    if (!user.is_verified) return [false, {}, ErrCode.NOT_VERIFIED];

    return [true, {}];
  };
};

const isEnv = (env: Environment): AuthStrategy => {
  return async (req, dc): Promise<AuthStratReturn> => {
    if (!Env.isEnv(env)) return [false, {}, ErrCode.UNKNOWN];
    return [true, {}];
  };
};

export default {
  isFromService,
  isEnv,
  isOurself,
  isLoggedIn,
  isMemberOfHost,
  hostIsOnboarded,
  userEmailIsVerified,
  hasHostPermission,
  hasSpecificHostPermission,
  isSiteAdmin,
  ...Auth
};
