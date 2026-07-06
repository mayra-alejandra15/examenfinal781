import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
    ) { }

    async getProfile(userId: number) {
        const user = await this.userRepo.findOne({
            where: { id: userId },
            relations: {
                wallet: true,
            },
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        return {
            uuid: user.uuid,
            fullName: user.fullName,
            ci: user.ci,
            email: user.email,
            phone: user.phone,
            role: user.role,
            mfaEnabled: user.mfaEnabled,
            wallet: {
                uuid: user.wallet?.uuid,
                balance: user.wallet?.balance,
            },
        };
    }
}