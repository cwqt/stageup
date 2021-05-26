# Tools

## `run-command.ts`

Utility for running various apps in different environments / locales.

```
npm run start
```

## `generate-xlf.ts`

Creates `xliff` translation files from an `i18n.hjson` for internationalizing our APIs.

```
npm run generate:xlf
```

### Usage

- Create a `i18n.hjson` file - [Human JSON](https://hjson.github.io/)
- Add codes with english translation
- Use in code like `@@some.nested.code` with [ICU Message formatting](http://userguide.icu-project.org/formatparse/messages)
- Generate xliff files `npm run generate:xlf`
- Translate xliffs using Poedit
- Save & restart server!

Example:

```ts
throw new ErrorHandler(HTTP.NotFound, '@@error.not_found', [
  { path: 'email_address', message: '@@user.not_found', code: '@@error.not_found' }
]);
```

## `generate-uml.ts`

Makes a PlantUML diagram from the TypeORM entities.

```
npm run generate:uml
```
