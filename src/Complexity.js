import espree from 'espree';
import estraverse from 'estraverse';
import _ from 'lodash';
import NodeType from './NodeType';

function Result() {
  return {
    ecc: 0,
    arity: 0,
    codeLines: {}
  };
}

export default class Complexity {

  constructor(code, parseConfig = {}) {
    const ast = espree.parse(code, parseConfig);
    this._ast = ast;
    estraverse.traverse(ast, (node, parentNode) => {
      node.parentNode = parentNode;
    });
  }

  addResults(a, b) {
    const s = new Result();
    s.ecc = a.ecc + b.ecc;

    let l = _.union(_.keys(a.codeLines), _.keys(b.codeLines));

    l.forEach(line => {
      s.codeLines[line] = true;
    });

    return s;
  }

  summarizeResults(ary) {
      if (ary.length === 1) {
        return this.addResults(new Result(), ary[0]);
      } else {
        ary = _.clone(ary);
        const initial = ary.pop();
        return ary.reduce(this.addResults, initial);
      }
  }

  recurseAll(ary) {
    if (!ary || ary.length < 1) {
      return new Result();
    }

    const results = ary.map(item => {
      return this.walkAst(item);
    });

    const summarized = this.summarizeResults(results);

    summarized.children = {};
    _.each(results, r => {
        if (r.name) {
          summarized.children[r.name] = r;
          delete r.name;
        } else if (r.children && _.size(r.children) > 0) {
          _.extend(summarized.children, r.children);
        }
    });

    return summarized;
  }

  walkAst(ast) {
    if (!ast) {
      return new Result();
    }

    let result, children, params, name;
    const type = ast.type;
    const line = ast.loc.start.line;
    const endLine = ast.loc.end.line;

    switch(type) {
      case NodeType.Program:
        children = ast.body;
        result = this.recurseAll(children);
        result.name = NodeType.Program;
        break;

      case NodeType.BlockStatement:
        children = ast.body;
        result = this.recurseAll(children);
        break;

      case NodeType.FunctionDeclaration:
      case NodeType.FunctionExpression:
      case NodeType.ArrowFunctionExpression:
        name = ast.id && ast.id.name || ast.parentNode && ast.parentNode.id && ast.parentNode.id.name || ('anon@' + line);
        params = ast.params;
        children = ast.body;

        result = this.walkAst(children);
        result.name = name;
        result.ecc += 1;
        result.arity = params.length;
        break;

      case NodeType.IfStatement:
      case NodeType.ConditionalExpression:
        children = [ast.consequent, ast.alternate];
        result = this.recurseAll(children);
        result.ecc += 1;
        break;

      case NodeType.ForStatement:
      case NodeType.ForInStatement:
      case NodeType.ForOfStatement:
      case NodeType.WhileStatement:
        result = this.walkAst(ast.body);
        result.ecc += 1;
        break;

      case NodeType.ClassDeclaration:
        result = this.walkAst(ast.body);
        break;

      case NodeType.CallExpression:
        result = this.recurseAll([...ast.arguments, ast.callee]);
        break;

      case NodeType.VariableDeclaration:
        result = this.recurseAll(ast.declarations);
        break;

      case NodeType.VariableDeclarator:
        result = this.walkAst(ast.init);
        break;

      case NodeType.TryStatement:
        children = [ast.block, ast.handler.body];
        result = this.recurseAll(children);
        result.ecc += 1;
        break;

      case NodeType.ExpressionStatement:
        result = this.walkAst(ast.expression);
        break;

      case NodeType.AssignmentExpression:
        result = this.walkAst(ast.right);
        break;

      case NodeType.ReturnStatement:
        if (ast.argument) {
          result = new Result();
        } else {
          result = this.walkAst(ast.argument);
        }
        break;

      case NodeType.SwitchStatement:
        if (ast.cases.length) {
          result = this.recurseAll(ast.cases);
        } else {
          result = new Result();
        }
        break;

      case NodeType.SwitchCase:
        result = this.recurseAll(ast.consequent);
        result.ecc += 1;
        break;

      case NodeType.MethodDefinition:
        result = this.walkAst(ast.value);
        break;

      default:
        result = new Result();
        break;
    }

    result.codeLines = endLine - line + 1;

    return result;
  }

  calc() {
    return this.walkAst(this._ast);
  }
}
