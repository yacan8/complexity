import complexity from '../lib/index.js';
import 'should';

describe('complexity', function () {
  it ('should give complexity 1 for an empty function', function () {
    const code = 'function test() { };';
    const res = complexity(code);
    res.children.test.ecc.should.eql(1);
  });
  it ('should give complexity 2 for an if statement', function () {
    const code = 'function test() { if (1) return 2; };';
    const res = complexity(code);
    res.children.test.ecc.should.eql(2);
  });
  it ('should give complexity 2 for a while statement', function () {
    const code = 'function test() { while (1) return 2; };';
    const res = complexity(code);
    res.children.test.ecc.should.eql(2);
  });
  it ('should give complexity 2 for a for statement', function () {
    const code = 'function test() { for (var i=0; i<5; i++) return 2; };';
    const res = complexity(code);
    res.children.test.ecc.should.eql(2);
  });
  it ('should give complexity 2 for a nested function definition', function () {
    const code = 'function test() { var f = function () { return 2; }; return f(); };';
    const res = complexity(code);
    res.children.test.ecc.should.eql(2);
  });
  it ('should give complexity 2 for a nested function declaration', function () {
    const code = 'function test() { function f() { return 2; }; return f(); };';
    const res = complexity(code);
    res.children.test.ecc.should.eql(2);
  });
  it ('should give complexity 1 for the nested function', function () {
    const code = 'function test() { function f() { return 2; }; return f(); };';
    const res = complexity(code);
    res.children.test.children.f.ecc.should.eql(1);
  });
  it ('should give complexity 2 for try/catch', function () {
    const code = 'function test() { try { return 1; } catch (err) { return 2; } };';
    const res = complexity(code);
    res.children.test.ecc.should.eql(2);
  });
  it ('should give complexity 1 for ?:', function () {
    const code = 'function test() { return 2 ? "a" : "b"; };';
    const res = complexity(code);
    res.children.test.ecc.should.eql(1);
  });
  it ('should give complexity 5 for a switch/case', function () {
    const code = 'function test(a) { switch (a) { case 1: break; case 2: break; case 3: break; default: break; };}';
    const res = complexity(code);
    res.children.test.ecc.should.eql(5);
  });
  it ('should give complexity 1 and 2 for two different functions', function () {
    const code = 'function a(b, c) { return b+c; } function test() { try { return 1; } catch (err) { return 2; } };';
    const res = complexity(code);
    res.children.a.ecc.should.eql(1);
    res.children.test.ecc.should.eql(2);
  });
  it ('should give correct complexity for a more involved function', function () {
    var code = `
      function test(a, b) {
          function handle(err) {
              if (err) {
                  var d = 1 ? 2 : 3;
              } else {
                  var d = 2 ? 3 : 4;
              }
          };
          for (var i = 0; i < 5; i++) {
              try {
                  var c = a ? a : b;
              } catch (err) {
                  if (err) handle(err);
              }
          }
      }
    `;
    const res = complexity(code);
    res.children.test.ecc.should.eql(9);
  });
});
describe('arity', function () {
  it ('should be correct for various functions', function () {
    const code = `
      function testa() {}

      function testb(a) {}
      
      function testc(a, b, c, d) {}
    `;
    var res = complexity(code);
    res.children.testa.arity.should.eql(0);
    res.children.testb.arity.should.eql(1);
    res.children.testc.arity.should.eql(4);
  });
});
describe('<toplevel>', function () {
  it ('should have reasonable values', function () {
    const code = `
      function testa() {}

      function testb(a) {}
      
      function testc(a, b, c, d) {}
    `;
    var res = complexity(code);
    res.ecc.should.equal(3);
    res.arity.should.equal(0);
  });
  it('should handle exported function', function () {
    const code = `
      module.exports = function () {
          if (true) {
              console.log(1);
          }
          console.log(2);
      }
    `;
    const res = complexity(code);
    res.ecc.should.equal(2);
    res.codeLines.should.equal(6);
    res.children['anon@2'].ecc.should.equal(2);
  });
});
describe('line count', function () {
  it ('should be correct for a piece of code', function () {
    const code = `
      function testa() {}

      /*
       * Block
       * Comment
       */
      function testb(a) {}
      
      // A comment here
      
      function testc(a, b, c, d) {
          console.log(2 /* 1+1 */ );
          console.log(2); // 1+1
          var x = 2 + 2;
      }
    `;

    const res = complexity(code);
    res.codeLines.should.equal(15);
  });
  it('should handle multiline expressions', function () {
    // Splitting a single expression over multiple lines doesn't count.
    // This might be considered a bug or a feature.

    const code = `
    function test() {
        var x = 2 + 2 + 2;
    }
    `;

    const res = complexity(code);
    res.codeLines.should.equal(3);
  });
});
