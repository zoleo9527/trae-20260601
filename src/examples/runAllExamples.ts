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

console.log('------------------------------------------------------------------------');
console.log('  第一部分：服务层直调示例');
console.log('------------------------------------------------------------------------');
try { runTodoExamples(); } catch (e) { console.error('示例0失败:', e); }
try { runHappyPathExample(); } catch (e) { console.error('示例1失败:', e); }
try { runProblemFlowExample(); } catch (e) { console.error('示例2失败:', e); }

console.log('\n');
console.log('------------------------------------------------------------------------');
console.log('  第二部分：API请求示例（通过handlers路由层）');
console.log('------------------------------------------------------------------------');
try { runRemindFlowExample(); } catch (e) { console.error('Flow A失败:', e); }
try { runReturnAndSupplementFlowExample(); } catch (e) { console.error('Flow B失败:', e); }
try { runArchiveConfirmationExample(); } catch (e) { console.error('Flow C失败:', e); }

console.log('\n');
console.log('========================================================================');
console.log('                           所有示例运行完毕');
console.log('========================================================================');
console.log('\n样例总结:');
console.log('  顺利流(Flow A)：催单订单->师傅开始安装->完成->归档（全流程正常）');
console.log('  问题流(Flow B)：预约->分配刘师傅->客户催单->改派陈师傅->开始安装->现场尺寸错+缺件->退回');
console.log('           ->处理退回->补料申请->备货->师傅收货->二次预约->二次安装->完成->归档');
console.log('  归档确认(Flow C)：安装完成->导购看到归档待办->店长归档->待办清空->审计追溯');
console.log('  待办查询：量尺师/导购/安装师傅/店长 各见职责内待办');
console.log('  审计日志：每步都有 操作人+时间+内容 完整记录，责任清晰');
console.log('  数据统一：预约/排班/退回/补料/备注/审计 全部挂在同一条Order记录下');
console.log('  API路由：25个端点覆盖 安装预约/师傅排班/退回处理/补料/审计日志 全流程\n');
