import bcrypt from 'bcryptjs';
const password = 'Smile123!123';
const hash = '$2b$10$wkgVACiTm0inmzZe.1jGAeiOfjS/rZlG4L5barLIWHU4rO8Ss2dFu';
const result = await bcrypt.compare(password, hash);
console.log('Result:', result);
