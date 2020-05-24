import ObjectAssign from 'object-assign';

const TYPEOF_IDENTIFIER = { $$typeof: 'raw json adapter' };

const baseObject = Object.create(Object, {
  $$typeof: {
    enumerable: false,
    writable: false,
    value: TYPEOF_IDENTIFIER
  }
});

function isRawType(value) {
    var type = typeof value;
    return type === 'string' ||
        type === 'number' ||
        type === 'boolean' ||
        type === 'undefined' ||
        value === null;
}

const DefaultOptions = {
    concatTextContent: false
};

function convertValueTypeToString(value) {

    if (typeof value === 'string') { // Common case can be fasttracked
        return value;
    }

    if (value === null || value === undefined) {
        return '';
    }

    return '' + value;
}

function concatenateStringChildren(accum, value) {
    if (isRawType(value) && accum.length &&
        isRawType(accum[accum.length - 1]))
    {
        accum[accum.length - 1] = convertValueTypeToString(accum[accum.length - 1]) + convertValueTypeToString(value);
        return accum;
    }
    accum.push(value);
    return accum;
}

function flatten(value) {
    if (!Array.isArray(value)) {
        return [value];
    }

    return value.reduce((result, item) => result.concat(flatten(item)), [])
}

class RawAdapter {

    constructor(options) {
        this._options = ObjectAssign({}, DefaultOptions, options);
    }

    getName(element) {
        if (typeof element.type === 'string') {
            return element.type;
        }

        return 'no-display-name';
    }

    getAttributes(element) {

        return element.props;
    }

    getChildren(element) {

        let children = element.children || [];
        children = children.filter(child => child !== null && child !== undefined);
        if (this._options.convertToString || 
            this._options.convertMultipleRawToStrings && children.length > 1) {
            children = children.map(child => isRawType(child) ? convertValueTypeToString(child) : child);
        }

        if (this._options.concatTextContent) {
            return children.reduce(concatenateStringChildren, []);
        }
        return children;
    }

    setOptions(newOptions) {

        this._options = ObjectAssign({}, this._options, newOptions);
    }

    getOptions() {
        return this._options;
    }
    
    serialize(adapter, element) {
        if (isRawType(element)) {
            return element;
        }
        
        const serialized = Object.create(baseObject);
        serialized.type = adapter.getName(element);
        serialized.props = adapter.getAttributes(element);
        for (let prop in serialized.props) {
          if (typeof serialized.props[prop] === 'function') {
            serialized.props[prop]._isRawDeserializedFunction = true;
          }
        }
        serialized.children = (adapter.getChildren(element) || []).map(child => this.serialize(adapter, child));
        return serialized;
    }
    
    isRawElement(value) {
        return (value && typeof value === 'object' &&
          value.$$typeof === TYPEOF_IDENTIFIER);
    }
    
    deserialize(value) {
        // Actually, this method just converts a raw JSON-ish value to objects with the correct $$typeof property,
        // So it's exactly the same as just serializing using this adapter
        return this.serialize(this, value);
    }
}


RawAdapter.prototype.classAttributeName = 'className';

export default RawAdapter;
