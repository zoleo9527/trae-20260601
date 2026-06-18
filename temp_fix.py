with open('src/order/service/order.service.ts', 'r') as f:
    content = f.read()

assign_owner_code = '''
  async assignOwner(
    id: string,
    dto: AssignOrderOwnerDto,
    actor: Actor,
  ): Promise<Order> {
    const order = await this.findOneOrFail(id);
    const old = {
      ownerRole: order.ownerRole,
      ownerId: order.ownerId,
      ownerName: order.ownerName,
    };
    order.ownerRole = dto.ownerRole;
    order.ownerId = dto.ownerId;
    order.ownerName = dto.ownerName;
    const saved = await this.orderRepo.save(order);
    await this.auditQuickLog(id, AuditAction.ASSIGN, actor, { old, new: dto });
    return saved;
  }
'''

get_audit_code = '''
  async getAuditTrailOnly(id: string): Promise<any[]> {
    await this.findOneOrFail(id);
    return this.getAuditTrail(id);
  }
'''

# 插入 assignOwner 在 clarifyService 结束后，confirm 之前
content = content.replace(
    '  async confirm(id: string, actor: Actor): Promise<Order> {',
    assign_owner_code + '\n  async confirm(id: string, actor: Actor): Promise<Order> {'
)

# 插入 getAuditTrailOnly 在 findOne 结束后，update 之前
content = content.replace(
    '  async update(id: string, dto: UpdateOrderDto, actor: Actor): Promise<Order> {',
    get_audit_code + '\n  async update(id: string, dto: UpdateOrderDto, actor: Actor): Promise<Order> {'
)

with open('src/order/service/order.service.ts', 'w') as f:
    f.write(content)

print('Done')
