import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

import { User } from '../users/entities/user.entity';
import { Wallet } from '../wallets/entities/wallet.entity';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
  ) {}

  async run() {
    const users = [
      {
        fullName: 'Administrador SecureWallet',
        ci: '10000001',
        email: 'admin@securewallet.com',
        phone: '70000001',
        password: 'Admin@12345',
        role: UserRole.ADMIN,
        balance: 1000,
      },
      {
        fullName: 'Usuario Demo Uno',
        ci: '10000002',
        email: 'user1@securewallet.com',
        phone: '70000002',
        password: 'User1@12345',
        role: UserRole.USER,
        balance: 500,
      },
      {
        fullName: 'Usuario Demo Dos',
        ci: '10000003',
        email: 'user2@securewallet.com',
        phone: '70000003',
        password: 'User2@12345',
        role: UserRole.USER,
        balance: 300,
      },
    ];

    for (const item of users) {
      const exists = await this.userRepo.findOne({
        where: { email: item.email },
      });

      if (exists) {
        console.log(`Ya existe: ${item.email}`);
        continue;
      }

      const passwordHash = await bcrypt.hash(item.password, 12);

      const user = this.userRepo.create({
        uuid: uuidv4(),
        fullName: item.fullName,
        ci: item.ci,
        email: item.email,
        phone: item.phone,
        passwordHash,
        role: item.role,
        mfaEnabled: false,
      });

      const savedUser = await this.userRepo.save(user);

      const wallet = this.walletRepo.create({
        uuid: uuidv4(),
        balance: item.balance,
        user: savedUser,
        userId: savedUser.id,
      });

      await this.walletRepo.save(wallet);

      console.log(`Creado: ${item.email}`);
    }

    console.log('Seeders ejecutados correctamente');
  }
}