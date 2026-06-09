const RecentModule = {
  render() {
    const items = Store.getRecentItems();
    const contracts = Store.getContracts();
    const archives = Store.getArchives();

    const recentContracts = items.filter(i => i.type === 'contract').map(i => ({
      ...i,
      contract: contracts.find(c => c.id === i.id)
    })).filter(i => i.contract);

    const recentArchives = items.filter(i => i.type === 'archive').map(i => ({
      ...i,
      archive: archives.find(a => a.id === i.id)
    })).filter(i => i.archive);

    const archivesWithUnconfirmed = Store.getArchivesWithUnconfirmedChanges();

    return `
      ${archivesWithUnconfirmed.length > 0 ? `
        <div class="card" style="border:2px solid #f59e0b;background:#fffbeb;margin-bottom:16px">
          <div class="card-header">
            <div class="card-title" style="color:#92400e">⚡ 待处理签约变更（${archivesWithUnconfirmed.length}条档案有未确认变更）</div>
            <button class="btn btn-outline btn-sm" onclick="App.navigateTo('archive-list');ArchiveModule._currentFilter='__unconfirmed__';App.refreshPage()">查看全部</button>
          </div>
          ${archivesWithUnconfirmed.map(a => {
            const unconfirmed = (a.changeAlerts || []).filter(ca => !ca.confirmed);
            const hasHigh = unconfirmed.some(ca => ca.priority === 'high');
            const lastChangedAt = ArchiveModule._getLastChangedAt(a);
            const responsible = ArchiveModule._getResponsiblePerson(a);
            return `
              <div class="recent-item" style="border-color:${hasHigh ? '#dc2626' : '#fbbf24'};background:${hasHigh ? '#fef2f2' : '#fff'}" onclick="ArchiveModule.showDetail('${a.id}')">
                <span class="recent-type ${hasHigh ? 'recent-type-high' : 'recent-type-archive'}">${hasHigh ? '高' : '变更'}</span>
                <div style="flex:1">
                  <div class="recent-label">${a.familyHeadName} · ${a.id}${hasHigh ? ' <span class="priority-badge priority-high" style="font-size:10px">高优先级</span>' : ''}</div>
                  <div style="font-size:12px;color:#92400e">${unconfirmed.length}条未确认：${unconfirmed.map(ca => ca.title).join('、')}</div>
                  <div style="font-size:11px;color:var(--text-light);margin-top:2px">
                    负责人：${responsible} | 最后变更：${lastChangedAt}
                  </div>
                </div>
                <span class="contract-change-flag">${unconfirmed.length}条待确认</span>
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}

      <div class="split-view">
        <div>
          <div class="section-title">最近打开的签约</div>
          ${recentContracts.length === 0 ? '<div class="card" style="text-align:center;color:var(--text-light);padding:20px">暂无记录</div>' :
            recentContracts.map(item => `
              <div class="recent-item" onclick="ContractModule.showDetail('${item.id}')">
                <span class="recent-type recent-type-contract">签约</span>
                <div style="flex:1">
                  <div class="recent-label">${item.contract.familyHead.name} · ${item.contract.contractType}</div>
                  <div style="font-size:12px;color:var(--text-secondary)">${item.id} · ${ContractModule._statusBadge(item.contract.status)}</div>
                </div>
                <span class="recent-time">${item.openedAt}</span>
              </div>
            `).join('')
          }
        </div>
        <div>
          <div class="section-title">最近打开的档案</div>
          ${recentArchives.length === 0 ? '<div class="card" style="text-align:center;color:var(--text-light);padding:20px">暂无记录</div>' :
            recentArchives.map(item => {
              const unconfirmedCount = (item.archive.changeAlerts || []).filter(ca => !ca.confirmed).length;
              return `
                <div class="recent-item" onclick="ArchiveModule.showDetail('${item.id}')">
                  <span class="recent-type recent-type-archive">档案</span>
                  <div style="flex:1">
                    <div class="recent-label">${item.archive.familyHeadName} · 建档${unconfirmedCount > 0 ? ` <span class="contract-change-flag" style="font-size:10px">${unconfirmedCount}条未确认</span>` : ''}</div>
                    <div style="font-size:12px;color:var(--text-secondary)">${item.id} · ${ArchiveModule._statusBadge(item.archive.status)}</div>
                  </div>
                  <span class="recent-time">${item.openedAt}</span>
                </div>
              `;
            }).join('')
          }
        </div>
      </div>

      <div class="section-gap">
        <div class="section-title">功能说明</div>

        <div class="card">
          <div class="section-title" style="margin-top:0">一、家庭签约处理</div>
          <div style="line-height:2;font-size:13px">
            <div><strong>状态流转：</strong>待处理 → 处理中 → 已退回 → 已补充 → 处理中 → 已关闭</div>
            <div><strong>全科医生：</strong>可创建签约、接单处理、退回（需填写原因）、修改签约内容、关闭签约。退回和修改会联动影响档案建档侧。</div>
            <div><strong>护士：</strong>可为处理中/已退回的签约添加备注、补充信息。护士添加的备注会同步到关联档案。</div>
            <div><strong>公卫专员：</strong>可查看签约信息、创建建档记录。签约处理完成后即可在签约详情页点击"创建建档"。</div>
            <div><strong>备注同步：</strong>签约侧添加的任何备注，会实时同步到关联的档案建档记录中，建档人员无需翻签约表即可看到所有签约备注。</div>
            <div><strong>退回联动：</strong>签约被退回时，关联的档案自动标记为"退回补录"，并在退回原因中标注"关联签约被退回：xxx"。</div>
          </div>
        </div>

        <div class="card">
          <div class="section-title" style="margin-top:0">二、最近打开</div>
          <div style="line-height:2;font-size:13px">
            <div><strong>自动记录：</strong>每次点击签约或档案查看详情时，自动记录到"最近打开"列表，按时间倒序排列。</div>
            <div><strong>快速定位：</strong>显示签约编号、户主姓名、签约类型及当前状态，点击可直接跳转详情页。</div>
            <div><strong>容量限制：</strong>最多保留 20 条最近记录，重复访问同一记录会更新时间并置顶。</div>
            <div><strong>待处理变更入口：</strong>页面顶部展示有未确认签约变更的档案列表，点击可直达档案详情页进行确认。每个档案显示未确认变更条数和变更类型摘要。</div>
          </div>
        </div>

        <div class="card">
          <div class="section-title" style="margin-top:0">三、批量录入</div>
          <div style="line-height:2;font-size:13px">
            <div><strong>操作权限：</strong>仅全科医生可操作批量录入。</div>
            <div><strong>使用方式：</strong>点击"添加一行"逐条添加，或点击"填充示例数据"快速填入示例。每行可填写户主姓名、身份证号、电话、签约类型、分配护士/公卫专员及备注。</div>
            <div><strong>批量创建：</strong>点击"批量创建"后，系统逐一创建签约记录，有备注的会自动添加签约备注。创建结果在下方列表展示，可点击查看详情。</div>
          </div>
        </div>

        <div class="card">
          <div class="section-title" style="margin-top:0">四、档案建档回看说明</div>
          <div style="line-height:2;font-size:13px">
            <div><strong>1. 备注继承：</strong>家庭签约处理时添加的备注，在创建档案建档时会自动继承为"签约备注（继承）"，建档人员可直接查阅，无需翻签约表。</div>
            <div><strong>2. 实时同步：</strong>签约侧新增备注后，关联档案的"签约备注（继承）"区域自动追加；如果签约被修改，档案列表页会显示 ⚡ 变动标记。</div>
            <div><strong>3. 退回联动：</strong>签约被退回时，关联档案自动标记为"退回补录"；签约补充信息后，档案也联动更新。</div>
            <div><strong>4. 修改感知：</strong>签约内容变更后，档案建档详情页顶部会出现黄色变更提醒卡片，列出每条变更的标题、详情和时间。</div>
            <div><strong>5. 持久化变更确认：</strong>签约备注新增、退回、补充、修改产生的变更提醒会写入本地数据持久保存，刷新页面不丢失。档案列表支持"未确认变更"筛选。</div>
            <div><strong>6. 已知悉操作：</strong>档案详情页可逐条点击"已知悉"确认变更，或点击"全部已知悉"批量确认。确认后记录确认人和确认时间，已确认变更移至"已确认变更记录"区域。</div>
            <div><strong>7. 手动同步：</strong>若签约备注与档案继承备注不一致，档案详情页会提示"签约侧有新备注尚未同步"，点击"同步签约备注"即可。</div>
            <div><strong>8. 健康记录：</strong>档案建档中可添加家庭成员的健康记录（慢性病、预防接种、随访、体检等），所有记录均可追溯操作历史。</div>
            <div><strong>9. 退回补录：</strong>公卫专员可将建档退回要求补录信息，护士可补充信息后重新提交。</div>
            <div><strong>10. 操作历史：</strong>每次状态变更、备注添加、变更确认都会记录在操作历史中，含操作人、角色、时间和详情。</div>
          </div>
        </div>

        <div class="card">
          <div class="section-title" style="margin-top:0">五、演示路径</div>
          <div style="line-height:2;font-size:13px">
            <div><strong>创建：</strong>全科医生 → 家庭签约 → "+ 新建签约" → 填写户主信息 → 创建</div>
            <div><strong>处理：</strong>签约详情 → "接单处理" → 添加备注 → 修改签约信息</div>
            <div><strong>退回：</strong>签约详情 → "退回" → 填写退回原因 → 确认（档案侧联动标记退回补录）</div>
            <div><strong>补充：</strong>签约详情 → "补充信息" → 填写补充内容 → 确认 → "重新处理"（档案侧联动恢复）</div>
            <div><strong>关闭：</strong>签约详情 → "关闭签约" → 确认</div>
            <div style="margin-top:8px;color:var(--text-secondary)">切换角色可在左侧栏选择"全科医生/护士/公共卫生专员"，不同角色可执行的操作不同。点击操作员姓名可切换同角色的不同人员。</div>
          </div>
        </div>
      </div>
    `;
  }
};

window.RecentModule = RecentModule;
