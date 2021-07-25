import { createXlf, readFile } from './methods';
import * as fs from 'fs';

// this is not even a parser, it's just a bunch of regexes shittly thrown together
// because none of the 5 xlf/xml parsers i've tried work properly
// jesus christ this format is complete aids

// this works with XLF 1.2 only

// <xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
//   <file source-language="en" datatype="plaintext" original="ng2.template" target-language="cy">
//     <body>
//        ITransUnit[]

interface Xlf {
  source_language: string;
  target_language: string;
  trans_units: ITransUnit[];
}

interface ITransUnit {
  id: string;
  target: string;
  source: string;
  ctx_group: string;
  state: 'new' | 'final' | 'translated' | 'needs-translation';
}

// Frontend trans-unit has the additional context-group tag
// <trans-unit id="8651709081998403400" datatype="html">
//    <source>I am dissatisfied with the user experience</source>
//    <target state="new">I am dissatisfied with the user experience</target>
//    <context-group purpose="location">
//      <context context-type="sourcefile">apps/frontend/src/app/_pipes/delete-host-reason.pipe.ts</context>
//      <context context-type="linenumber">9</context>
//    </context-group>
// </trans-unit>

const parse = async (path: string): Promise<Xlf> => {
  const file = await readFile(path);

  // Get source & target language
  const [sourceLanguage] = file.match(/(?<=source-language=")(.*?)(?=")/g);
  const [targetLanguage] = file.match(/(?<=target-language=")(.*?)(?=")/g);

  // Regex match the <body> tag out of the file to get us the trans-unit tags alone
  const body = file.match(/\<body\>.*\<\/body\>/gs);
  if (!body.length) throw new Error('Could not find <body> tag');

  // Ok, now get all trans-unit tags
  const trannies: ITransUnit[] = []; // heh
  for await (let unit of body[0].match(/<trans-unit[^>]*>(.*?)<\/trans-unit>/gms)) {
    // get <trans-unit> tag for id attribute
    const [head] = unit.match(/<trans-unit[^>]*>/);

    // get id="my_id" --> my_id
    const [id] = head.match(/"([^"]*)"/).map(m => m.replaceAll('"', ''));

    // get <target> & target state
    const [target_tag] = unit.match(/<target[^>]*>(.*?)<\/target>/gms);
    const [state] = target_tag.match(/"([^"]*)"/).map(m => m.replaceAll('"', ''));
    const [target] = target_tag.match(/(?<=>)(.*)(?=<\/)/gms);

    // get <source>
    const [source] = unit.match(/(?<=<source[^>]*>)(.*?)(?=<\/source>)/gms);

    // get context-group (if any)
    const [ctx_group] = unit.match(/<context-group[^>]*>(.*?)<\/context-group>/gms) || [];

    trannies.push({
      id: id,
      target: target,
      source: source,
      ctx_group: ctx_group,
      state: state as ITransUnit['state']
    });

    console.log(trannies[trannies.length - 1]);
  }

  return {
    source_language: sourceLanguage,
    target_language: targetLanguage,
    trans_units: trannies
  };
};

const save = async (path: string, xlf: Xlf): Promise<void> => {
  const file = createXlf(
    xlf.trans_units.map(u => toUnit(u)),
    xlf.source_language,
    xlf.target_language
  );

  fs.writeFileSync(path, file);
};

const toUnit = (unit: ITransUnit): string => {
  return `\n\t\t<trans-unit id="${unit.id}" datatype="html">
      <source>${unit.source}</source>
      <target state="${unit.state}">${unit.target}</target>${unit.ctx_group ? `\n${unit.ctx_group}` : ''}
    </trans-unit>`;
};
export default { parse, save };
