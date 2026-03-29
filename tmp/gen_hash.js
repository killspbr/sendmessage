const bcrypt = require('bcryptjs');
const password = 'Smile123!123';
const salt = 10;
bcrypt.hash(password, salt, (err, hash) => {
    if (err) console.error(err);
    console.log(hash);
});
