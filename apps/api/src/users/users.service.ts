import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserPreference, Group } from '../database/entities';
import { Role, UserStatus } from '@cti/shared';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(UserPreference) private prefRepo: Repository<UserPreference>,
    @InjectRepository(Group) private groupRepo: Repository<Group>,
    private auditService: AuditService,
  ) {}

  async findAll(page = 1, limit = 20) {
    const [data, total] = await this.userRepo.findAndCount({
      relations: ['groups'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const user = await this.userRepo.findOne({ where: { id }, relations: ['groups'] });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async updateRole(id: string, role: Role, actorId: string) {
    const user = await this.findById(id);
    const oldRole = user.role;
    user.role = role;
    await this.userRepo.save(user);
    await this.auditService.log(actorId, 'USER_ROLE_CHANGED', 'user', id, { oldRole, newRole: role });
    return user;
  }

  async updateStatus(id: string, status: UserStatus, actorId: string) {
    const user = await this.findById(id);
    user.status = status;
    await this.userRepo.save(user);
    await this.auditService.log(actorId, 'USER_STATUS_CHANGED', 'user', id, { status });
    return user;
  }

  async assignGroups(userId: string, groupIds: string[], actorId: string) {
    const user = await this.findById(userId);
    const groups = await this.groupRepo.findByIds(groupIds);
    user.groups = groups;
    await this.userRepo.save(user);
    await this.auditService.log(actorId, 'USER_GROUPS_CHANGED', 'user', userId, { groupIds });
    return user;
  }

  async getPreferences(userId: string) {
    let pref = await this.prefRepo.findOneBy({ userId });
    if (!pref) {
      pref = this.prefRepo.create({ userId, followedTags: [], followedCategories: [], keywordsInclude: [], keywordsExclude: [] });
      pref = await this.prefRepo.save(pref);
    }
    return pref;
  }

  async updatePreferences(userId: string, data: Partial<UserPreference>) {
    let pref = await this.prefRepo.findOneBy({ userId });
    if (!pref) {
      pref = this.prefRepo.create({ userId });
    }
    Object.assign(pref, data);
    return this.prefRepo.save(pref);
  }
}
