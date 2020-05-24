# js-writer

A simple JavaScript object to string converter.

This converts a JavaScript value to a string that is interpretable JavaScript.

## Usage
```js
var jsWriter = require('js-writer');

var stringRepresentation = jsWriter({
   a: 42,
   b: 'foo',
   'big-string': `an ES6 string
with line breaks`,
   getMagic: function () { return 42; }
});

console.log(stringRepesentation);


// Output:
// {a:42,b:"foo","big-string":"an ES6 string\nwith line breaks",getMagic:function () { return 42; }}

```

## Custom handling for functions, dates and symbols

Passing a `handlers` object in the options with the (optional) keys of `date` or `function` allows
you to override the behaviour of these types. The function receives the value, and should return a 
string of the string representation required.

```js

var s = jsWriter({ f: function foo(a, b) { return a + b; } }, {
  handlers: {
    'function': function (funcValue) {
      return JSON.stringify({ type: 'function', name: funcValue.name });
    }
  }
});

// s == '{f:{"type":"function","name":"foo"}}'
```

## Differences to `JSON.stringify`

The output _is not JSON_, it is JavaScript, so object keys that do not need to be quoted aren't, and functions are outputted as interpretable functions (note that normal unbound functions use the native `.toString()` implementation, so include their source). Dates are recreated by parsing the `.toISOString()` output (this is done to aid readability, rather than using the native `.getTime()` value).

## Why?

This was developed for use with [unexpected-react](https://github.com/bruderstein/unexpected-react) in order to support snapshot testing with [jest](https://facebook.github.io/jest/) and have better matching of functions.

## Supported values

Only basic native types are supported (number including NaN, string, undefined, function, Object, Array, Date).

ES6 collection types (`Map` and `Set`) are planned, but not yet set when.

## License

[MIT License](./LICENSE)
