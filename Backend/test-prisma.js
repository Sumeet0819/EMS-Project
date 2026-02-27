const prisma = require("./src/db/prisma");
console.log("Prisma models:", Object.keys(prisma).filter(k => !k.startsWith('_')));
process.exit(0);
