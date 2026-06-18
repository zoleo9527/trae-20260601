import os

B = '/Users/liu/Documents/private/model-test/trae-20260601-5/src'

def w(rel, content):
    full = os.path.join(B, rel)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, 'w') as f:
        f.write(content)
    print(f'Wrote {rel}: {len(content.splitlines())} lines')

w('common/enums/audit-action.enum.ts', """export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  STATUS_CHANGE = 'STATUS_CHANGE',
  REPORT_NO_SHOW = 'REPORT_NO_SHOW',
  HANDLE_NO_SHOW = 'HANDLE_NO_SHOW',
  CLARIFY = 'CLARIFY',
  ASSIGN = 'ASSIGN',
  FOLLOW_UP = 'FOLLOW_UP',
  ESCALATE = 'ESCALATE',
  RESOLVE = 'RESOLVE',
  CLOSE_WITHOUT_RESOLUTION = 'CLOSE_WITHOUT_RESOLUTION',
}
""")
