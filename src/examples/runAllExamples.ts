import { runTodoExamples, runHappyPathExample } from './happyPathExample';
import { runProblemFlowExample } from './problemFlowExample';
import { runRemindFlowExample, runReturnAndSupplementFlowExample, runArchiveConfirmationExample } from './requestExamples';

console.log('\n');
console.log('========================================================================');
console.log('          窗帘门店 - 安装预约与师傅排班系统 - 业务流程示例输出');
console.log('========================================================================');
console.log('\n业务场景:');
console.log('  - 初始数据: 3张订单（待量尺 / 已量尺待预约 / 已催单）');
console.log('  - 角色: 导购2人、量尺师1人、安装师傅2人、店长1人');
console.log('  - 状态机: CREATED->MEASURED->APPOINTED->INSTALLATION_SCHEDULED->INSTALLING->COMPLETED->ARCHIVED');
console.log('  - 异常: REMINDED(催单)、RETURNED(退回)、MATERIALS_NEEDED(补料)');
console.log('\n核心能力:');
console.log('  1. 各角色待办自动生成（导购/量尺师/安装师傅/店长 各见职责内待办）');
console.log('  2. 预约/排班/退回/补料/备注 统一挂在同一Order记录');
console.log('  3. 师傅排班回看（按人、按日期范围）');
console.log('  4. 详情查询（状态+预约+排班+退回+补料+备注+审计一体）');
console.log('  5. 安装预约处理（量尺/预约/开始安装/退回/补料/完成/归档）');
console.log('  6. 审计日志（所有操作留痕，责任可追溯）');
console.log('  7. API路由层（25个端点，请求示例可跑通）');
console.log('');
console.log('注意: 任一链路失败将直接报错停止，不继续后续示例。');
console.log('');

console.log('------------------------------------------------------------------------');
console.log('  第一部分：服务层直调示例');
console.log('------------------------------------------------------------------------');
runTodoExamples();
runHappyPathExample();
runProblemFlowExample();

console.log('\n');
console.log('------------------------------------------------------------------------');
console.log('  第二部分：API请求示例（通过handlers路由层）');
console.log('------------------------------------------------------------------------');
runRemindFlowExample();
runReturnAndSupplementFlowExample();
runArchiveConfirmationExample();

console.log('\n');
console.log('========================================================================');
console.log('                        所有示例运行完毕（全部通过）');
console.log('========================================================================');
console.log('');
