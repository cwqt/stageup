# Fragments

i18n.yaml

```yaml
message: >
  [fragment::headers.hello]

  How are you doing?

headers:
  hello: Hey {username}! It's {date} today!
```

RegEx match: `\[fragment::(.*?)\]`

Given arguments of:

- `username`: Cass
- `date`: 29/07/21

Would result in a final output of:

```
Hello Cass! It's 29/07/21 today!

How are you doing?
```

Generating autogen types file will require a bit more tact due to having to traverse through nested fragments - though maybe not depending on where the replacement is done.

Doing the fragment replacing should be done in the pre-processing stage when converting from MD -> XLF.
