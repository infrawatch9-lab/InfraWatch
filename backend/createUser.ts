//quero adicionar um novo usuário
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createUser() {
  const password = await bcrypt.hash('string', 10);
  const user = await prisma.user.create({
    data: {
      email: 'vicor32leonel@gmail.com',
      password,
      name: 'Leonel Vitor',
      role: 'ADMIN',
      number: '923794545',
      status: 'ACTIVE',
    },
  });
  await prisma.$disconnect();
  console.log(user + 'criado com sucesso');
}

createUser().catch((e) => {
  console.error(e);
  process.exit(1);
});
