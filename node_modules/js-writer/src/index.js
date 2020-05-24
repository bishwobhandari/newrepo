
var JS_VAR_ALLOWED = /^[a-zA-Z$_][a-zA-Z0-9$_]*$/;

function jsWriter(value, options) {
  var output = [];
  options = options || {};
  options.handlers = options.handlers || {};
  appendOutput(output, value, options);
  return output.filter(function (str) { return str != null; }).join('');
}

function appendOutput(output, value, options) {
  
  switch (typeof value) {
    case 'number':
      output.push('' + value);
      break;
    
    case 'string':
      output.push(JSON.stringify(value));
      break;

    case 'boolean':
      output.push(JSON.stringify(value));
      break;
      
    case 'undefined':
      output.push('undefined');
      break;
      
    case 'object':
      if (value === null) {
        output.push('null');
        break;
      }

      if (Array.isArray(value)) {
        outputArray(output, value, options);
      } else if (value && Object.getPrototypeOf(value) == Date.prototype) {
        if (options.handlers.date) {
          output.push(options.handlers.date(value))
          break;
        }
        outputDate(output, value, options);
      } else {
        outputObject(output, value, options);
      }
      break;
      
    case 'function':
      if (options.handlers['function']) {
        output.push(options.handlers['function'](value));
        break;
      }
      
      if (value.name && value.name.substr(0, 'bound '.length) === 'bound ') {
        output.push('function ', value.name.substr('bound '.length), '(');
        output.push(') { /* bound - native code */ }');
      } else {
        output.push(value.toString())
      }
      break;

    case 'symbol':
      if (options.handlers.symbol) {
        output.push(options.handlers.symbol(value));
        break;
      }
      var keyName = Symbol.keyFor(value);
      if (keyName !== undefined) {
        output.push('Symbol.for(');
        output.push(JSON.stringify(keyName));
        output.push(')');
      } else {
        var symbolName = value.toString();
        var match = /^Symbol\((.+)\)$/.exec(symbolName);
        if (match) {
          output.push('Symbol(');
          output.push(JSON.stringify(match[1]));
          output.push(')');
        } else {
          output.push('Symbol()');
        }
      }
  }
}


function outputObject(output, value, options) {
  
  var props = [];
  
  for (var key in value) {
    props.push(key);
  }
  
  props = props.sort();
  output.push('{');
  var join = '';
  for (var i = 0; i < props.length; ++i) {
    output.push(join);
    join = ',';
    if (JS_VAR_ALLOWED.test(props[i])) {
      output.push(props[i]);
    } else {
      output.push(JSON.stringify(props[i]));
    }
    output.push(':');
    appendOutput(output, value[props[i]], options);
  }
  output.push('}');
}

function outputArray(output, value, options) {
  
  output.push('[');
  var join = '';
  for (var i = 0; i < value.length; ++i) {
    output.push(join);
    join = ',';
    appendOutput(output, value[i], options);
  }
  output.push(']');
}

function outputDate(output, value, options) {
  output.push('new Date(Date.parse("', value.toISOString(), '"))');
}

module.exports = jsWriter;
