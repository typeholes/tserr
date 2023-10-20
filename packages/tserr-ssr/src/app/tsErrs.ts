import messages from './diagnosticMessages.json';

const strings = Object.keys(messages);

const split = strings.map( s => [s, s.replace(/\.$/,'').split(/('\{)|(\}')/)]);


const errs = split.map( ([name, parts]) => ({
  name,
  keys: parts
}));

