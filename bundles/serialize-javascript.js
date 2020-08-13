import crypto from 'crypto';

var randombytes = crypto.randomBytes;

// Generate an internal UID to make the regexp pattern harder to guess.
var UID_LENGTH          = 16;
var UID                 = generateUID();

function generateUID() {
    var bytes = randombytes(UID_LENGTH);
    var result = '';
    for(var i=0; i<UID_LENGTH; ++i) {
        result += bytes[i].toString(16);
    }
    return result;
}
