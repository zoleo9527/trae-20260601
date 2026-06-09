import { Card, Table, Tag, Space, Typography, Progress, Collapse } from 'antd'
import type { Assessment } from '@/types'

const { Text, Paragraph } = Typography

const SEVERITY_COLOR = (s: number) => {
  if (s <= 3) return '#52c41a'
  if (s <= 6) return '#faad14'
  return '#ff4d4f'
}

const SIDE_MAP: Record<string, string> = { left: '左侧', right: '右侧', bilateral: '双侧', center: '中央' }

interface Props {
  assessment: Assessment
  compact?: boolean
}

export default function AssessmentEvidence({ assessment, compact }: Props) {
  const { scales, painPoints, contraindications, conclusion } = assessment

  if (compact) {
    return (
      <Card size="small" style={{ marginBottom: 8, background: '#f6ffed', borderLeft: '4px solid #52c41a' }}>
        <div style={{ marginBottom: 4 }}>
          <Text strong>评估结论: </Text>
          <Text>{conclusion}</Text>
        </div>

        {scales.length > 0 && (
          <div style={{ marginBottom: 4 }}>
            <Text type="secondary">量表评分: </Text>
            {scales.map((s) => (
              <Tag key={s.id} style={{ marginBottom: 2 }}>
                {s.name}: <Text strong style={{ color: s.score / s.maxScore < 0.4 ? '#52c41a' : s.score / s.maxScore < 0.7 ? '#faad14' : '#ff4d4f' }}>{s.score}/{s.maxScore}</Text>
              </Tag>
            ))}
          </div>
        )}

        {painPoints.length > 0 && (
          <div style={{ marginBottom: 4 }}>
            <Text type="secondary">疼痛点: </Text>
            {painPoints.map((p) => (
              <Tag key={p.id} color={SEVERITY_COLOR(p.severity)} style={{ marginBottom: 2 }}>
                {p.region}({SIDE_MAP[p.side] ?? p.side}) {p.severity}/10
              </Tag>
            ))}
          </div>
        )}

        {contraindications.length > 0 && (
          <div>
            <Text type="secondary">训练禁忌: </Text>
            {contraindications.map((ci) => (
              <Tag key={ci.id} color={ci.type === 'absolute' ? 'red' : 'orange'} style={{ marginBottom: 2 }}>
                {ci.type === 'absolute' ? '绝对' : '相对'}: {ci.description}
              </Tag>
            ))}
          </div>
        )}
      </Card>
    )
  }

  return (
    <Collapse
      defaultActiveKey={['conclusion', 'scales', 'pain', 'contraindications']}
      size="small"
      style={{ marginBottom: 8 }}
      items={[
        {
          key: 'conclusion',
          label: <Text strong>📋 评估结论</Text>,
          children: (
            <Paragraph style={{ margin: 0, background: '#f6ffed', padding: 8, borderRadius: 4, borderLeft: '3px solid #52c41a' }}>
              {conclusion}
            </Paragraph>
          ),
        },
        {
          key: 'scales',
          label: <Text strong>📊 量表评分 ({scales.length})</Text>,
          children: scales.length > 0 ? (
            <Space direction="vertical" style={{ width: '100%' }} size={6}>
              {scales.map((s) => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', background: '#fafafa', borderRadius: 4 }}>
                  <Text strong style={{ minWidth: 180, fontSize: 13 }}>{s.name}</Text>
                  <Text strong style={{ fontSize: 16, color: '#1890ff' }}>{s.score}<Text type="secondary" style={{ fontSize: 12 }}>/{s.maxScore}</Text></Text>
                  <Progress
                    percent={Math.round((s.score / s.maxScore) * 100)}
                    strokeColor={s.score / s.maxScore < 0.4 ? '#52c41a' : s.score / s.maxScore < 0.7 ? '#faad14' : '#ff4d4f'}
                    size="small"
                    style={{ flex: 1, minWidth: 80 }}
                  />
                  <Text type="secondary" style={{ fontSize: 12, maxWidth: 200 }}>{s.interpretation}</Text>
                </div>
              ))}
            </Space>
          ) : <Text type="secondary">无量表记录</Text>,
        },
        {
          key: 'pain',
          label: <Text strong>🔥 疼痛点 ({painPoints.length})</Text>,
          children: painPoints.length > 0 ? (
            <Table
              dataSource={painPoints}
              rowKey="id"
              size="small"
              pagination={false}
              columns={[
                { title: '部位', dataIndex: 'region', key: 'region', width: 120 },
                { title: '侧别', dataIndex: 'side', key: 'side', width: 70, render: (v: string) => SIDE_MAP[v] ?? v },
                { title: '程度', dataIndex: 'severity', key: 'severity', width: 80, render: (v: number) => <Tag color={SEVERITY_COLOR(v)}>{v}/10</Tag> },
                { title: '性质', dataIndex: 'nature', key: 'nature', width: 80 },
                { title: '备注', dataIndex: 'notes', key: 'notes' },
              ]}
            />
          ) : <Text type="secondary">无疼痛点记录</Text>,
        },
        {
          key: 'contraindications',
          label: <Text strong>⚠️ 训练禁忌 ({contraindications.length})</Text>,
          children: contraindications.length > 0 ? (
            <Space direction="vertical" style={{ width: '100%' }} size={6}>
              {contraindications.map((ci) => (
                <div key={ci.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', background: ci.type === 'absolute' ? '#fff2f0' : '#fff7e6', borderRadius: 4, borderLeft: `3px solid ${ci.type === 'absolute' ? '#ff4d4f' : '#faad14'}` }}>
                  <Tag color={ci.type === 'absolute' ? 'red' : 'orange'}>{ci.type === 'absolute' ? '绝对禁忌' : '相对禁忌'}</Tag>
                  <Text strong>{ci.description}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>原因: {ci.reason}</Text>
                </div>
              ))}
            </Space>
          ) : <Text type="secondary">无禁忌记录</Text>,
        },
      ]}
    />
  )
}
