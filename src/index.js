import Complexity from './Complexity';

const parseConfig = {
  attachComment: false,
  comment: false,
  ecmaVersion: 5,
  loc: true
};

export default function facade(code) {
  return new Complexity(code, parseConfig).calc();
}
