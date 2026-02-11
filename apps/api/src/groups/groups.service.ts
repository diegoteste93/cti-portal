import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group, GroupPolicy } from '../database/entities';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group) private groupRepo: Repository<Group>,
    @InjectRepository(GroupPolicy) private policyRepo: Repository<GroupPolicy>,
    private auditService: AuditService,
  ) {}

  async findAll() {
    return this.groupRepo.find({ relations: ['policy'], order: { name: 'ASC' } });
  }

  async findById(id: string) {
    const group = await this.groupRepo.findOne({ where: { id }, relations: ['policy', 'users'] });
    if (!group) throw new NotFoundException('Grupo não encontrado');
    return group;
  }

  async create(data: Partial<Group>, actorId: string) {
    const group = this.groupRepo.create(data);
    const saved = await this.groupRepo.save(group);
    await this.auditService.log(actorId, 'GROUP_CREATED', 'group', saved.id);
    return saved;
  }

  async update(id: string, data: Partial<Group>, actorId: string) {
    const group = await this.findById(id);
    Object.assign(group, data);
    const saved = await this.groupRepo.save(group);
    await this.auditService.log(actorId, 'GROUP_UPDATED', 'group', id, data as any);
    return saved;
  }

  async updatePolicy(groupId: string, data: Partial<GroupPolicy>, actorId: string) {
    let policy = await this.policyRepo.findOneBy({ groupId });
    if (!policy) {
      policy = this.policyRepo.create({ groupId });
    }
    Object.assign(policy, data);
    const saved = await this.policyRepo.save(policy);
    await this.auditService.log(actorId, 'GROUP_POLICY_UPDATED', 'group_policy', groupId, data as any);
    return saved;
  }
}
