import bcrypt from 'bcryptjs';
const password = 'Smile123!123';
const hash = await bcrypt.hash(password, 10);
console.log('Password:', password);
console.log('Generated Hash:', hash);
const check = await bcrypt.compare(password, hash);
console.log('Compare:', check);
