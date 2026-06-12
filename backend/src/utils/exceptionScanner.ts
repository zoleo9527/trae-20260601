import { getDb } from '../database';
import {
  Project,
  ProjectArrangement,
  ExpertSigninRecord,
  ExceptionType,
} from '../types';
import { checkAutoTriggerException } from './statusMachine';
import { checkAndTriggerExceptions } from './exceptionHandler';
import { convertFields } from './fieldConverter';

const SCAN_INTERVAL_MS = 5 * 60 * 1000;

const scanAndTriggerExceptions = async (): Promise<void> => {
  try {
    const db = await getDb();

    const activeProjects = await db.all(
      `SELECT * FROM projects 
       WHERE status NOT IN ('archived', 'cancelled', 'draft')
       ORDER BY updated_at DESC`
    );

    let triggeredCount = 0;

    for (const p of activeProjects) {
      const projectObj: Project = convertFields.project(p);

      const arrangement = await db.get(
        'SELECT * FROM project_arrangements WHERE project_id = ? ORDER BY created_at DESC LIMIT 1',
        [projectObj.id]
      );
      const arrangementObj: ProjectArrangement | null = arrangement
        ? convertFields.arrangement(arrangement)
        : null;

      const signinRecords = await db.all(
        'SELECT * FROM expert_signin_records WHERE project_id = ? ORDER BY created_at',
        [projectObj.id]
      );
      const signinRecordsObj: ExpertSigninRecord[] = signinRecords.map((r) =>
        convertFields.signinRecord(r)
      );

      const autoException: ExceptionType | null = checkAutoTriggerException(
        projectObj,
        arrangementObj,
        signinRecordsObj
      );

      if (autoException) {
        const triggered = await checkAndTriggerExceptions(
          projectObj,
          arrangementObj,
          signinRecordsObj,
          autoException,
          `定时扫描检测 - ${new Date().toISOString()}`
        );
        if (triggered) {
          triggeredCount++;
          console.log(
            `[定时扫描] 项目「${projectObj.name}(${projectObj.projectNo})」触发异常: ${autoException}`
          );
        }
      }
    }

    if (triggeredCount > 0) {
      console.log(`[定时扫描] 共检测并触发 ${triggeredCount} 个异常`);
    }
  } catch (error) {
    console.error('[定时扫描] 异常检测失败:', error);
  }
};

let intervalHandle: NodeJS.Timeout | null = null;

export const startExceptionScanner = (): void => {
  if (intervalHandle) return;

  console.log(
    `[定时扫描] 异常检测定时器已启动，每 ${SCAN_INTERVAL_MS / 1000 / 60} 分钟执行一次`
  );

  setTimeout(() => {
    scanAndTriggerExceptions();
  }, 15 * 1000);

  intervalHandle = setInterval(scanAndTriggerExceptions, SCAN_INTERVAL_MS);
};

export const stopExceptionScanner = (): void => {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    console.log('[定时扫描] 异常检测定时器已停止');
  }
};
