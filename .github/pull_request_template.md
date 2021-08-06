## Description

Include brief bullet pointed list of changes & include changes in `.env` (if any):

- I did `x, y and z`
- `ENV_KEY` → `NEW_ENV_KEY`

## Screenshots

- **Frontend**: Video of frontend if new component added / existing component modified
- **Backend**: Screenshot of integration test passing if new route added / existing route modified

## Deploy

When PR complete & ready for review by a PM, make a commit with the body `/deploy` to create a temporary deployment of this branch at `https://su-xxx.stageup.uk`.

```shell
git commit --allow-empty -m "/deploy"
```

## PR title

Follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) standard. e.g.

```
<type>: <message>
<type>(<scope>): <message>

feature(SU-120): As a User I want to ...
fix(SU-912): Fix component from ....
release: version 0.2.1
```

**Common Types**

- `feature` - A large feature that consist of multiple types of changes.
- `fix` - Fixes existing functionality.
- `release` - Not a breaking change but bumps the major version.
- `update` - Updates an existing feature.
- `misc` - Catch all for commits that don't align with other types.
