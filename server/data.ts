import type { Detention } from '../src/types.js'

let detentions: Detention[] = [
  {
    id: 'DET-2024-001',
    waybillNo: 'CAE-2024-001587',
    goodsName: '锂离子电池组 UN3481',
    declaredGoodsName: '电子配件',
    goodsCode: 'UN3481',
    detainTime: '2024-11-15T09:30:00+08:00',
    detainReason: 'name_mismatch',
    detainBasis:
      '依据《民航危险品运输管理规定》CCAR-276-R1第276.87条，实际货物与申报品名不符，锂电池属第9类危险品，未按危险品申报',
    inspector: '王建军',
    receiver: '李明',
    warehouseImpact: '货物暂存于危险品专用库区B-12位，需与其他货物隔离存放',
    status: 'supplementing',
    requiredDocs: [
      {
        id: 'rd-1-1',
        docName: '危险品申报单',
        description: '需提供完整的危险品申报单',
        isRequired: true,
      },
      {
        id: 'rd-1-2',
        docName: '锂电池UN38.3测试报告',
        description: '需提供UN38.3测试报告',
        isRequired: true,
      },
      {
        id: 'rd-1-3',
        docName: '危险品运输许可证',
        description: '需提供危险品运输许可证',
        isRequired: true,
      },
      {
        id: 'rd-1-4',
        docName: '货物安全数据表(MSDS)',
        description: '需提供货物安全数据表',
        isRequired: true,
      },
    ],
    originalDocs: [
      {
        docName: '危险品申报单',
        docNo: '',
        issueDate: '',
        status: 'missing',
        remark: '未提供',
      },
      {
        docName: 'MSDS',
        docNo: '',
        issueDate: '',
        status: 'missing',
        remark: '未提供',
      },
      {
        docName: '运单',
        docNo: 'CAE-2024-001587',
        issueDate: '2024-11-14',
        status: 'normal',
        remark: '',
      },
    ],
    supplementaryDocs: [
      {
        id: 'sd-1-1',
        docName: '危险品申报单',
        uploadTime: '2024-11-16T14:20:00+08:00',
        uploadedBy: '李明',
        fileName: '危险品申报单_CAE-2024-001587.pdf',
        reviewStatus: 'pending',
        reviewComment: '',
      },
    ],
    reviews: [],
    finalResult: null,
    finalResultTime: null,
    finalResultBy: null,
    finalResultComment: null,
  },
  {
    id: 'DET-2024-002',
    waybillNo: 'CAE-2024-001623',
    goodsName: '医用放射性同位素 I-131',
    declaredGoodsName: '医用放射性同位素 I-131',
    goodsCode: 'UN2910',
    detainTime: '2024-11-14T11:00:00+08:00',
    detainReason: 'missing_cert_page',
    detainBasis:
      '依据《民用航空危险品运输管理规定》第127条，托运人提供的放射性物质运输许可证（编号：RA-2024-0892）缺少第3页装载证明及第5页应急处理方案，证照不完整',
    inspector: '赵国庆',
    receiver: '陈芳',
    warehouseImpact: '已移至放射源专用隔离库C-03位，库区辐射监测正常',
    status: 'reviewing',
    requiredDocs: [
      {
        id: 'rd-2-1',
        docName: '放射性物质运输许可证完整件(含第3页装载证明)',
        description: '需补齐缺失的第3页装载证明',
        isRequired: true,
      },
      {
        id: 'rd-2-2',
        docName: '辐射防护方案(含第5页应急处理方案)',
        description: '需补齐缺失的第5页应急处理方案',
        isRequired: true,
      },
      {
        id: 'rd-2-3',
        docName: '环保部门审批文件',
        description: '需提供环保部门审批文件',
        isRequired: true,
      },
    ],
    originalDocs: [
      {
        docName: '放射性物质运输许可证',
        docNo: 'RA-2024-0892',
        issueDate: '2024-03-10',
        status: 'missing_page',
        remark: '缺第3页和第5页',
      },
      {
        docName: '辐射防护方案',
        docNo: 'RP-2024-0456',
        issueDate: '2024-06-20',
        status: 'normal',
        remark: '',
      },
    ],
    supplementaryDocs: [
      {
        id: 'sd-2-1',
        docName: '放射性物质运输许可证完整件(含第3页装载证明)',
        uploadTime: '2024-11-15T09:10:00+08:00',
        uploadedBy: '陈芳',
        fileName: '放射性运输许可证_完整件.pdf',
        reviewStatus: 'approved',
        reviewComment: '第3页装载证明已补齐',
      },
      {
        id: 'sd-2-2',
        docName: '辐射防护方案(含第5页应急处理方案)',
        uploadTime: '2024-11-15T09:15:00+08:00',
        uploadedBy: '陈芳',
        fileName: '辐射防护方案_含应急处理.pdf',
        reviewStatus: 'approved',
        reviewComment: '第5页应急处理方案已补齐',
      },
    ],
    reviews: [
      {
        id: 'rv-2-1',
        reviewer: '刘主任',
        reviewTime: '2024-11-15T16:00:00+08:00',
        opinion: 'approve',
        comment: '补证材料齐全，同意放行',
      },
    ],
    finalResult: null,
    finalResultTime: null,
    finalResultBy: null,
    finalResultComment: null,
  },
  {
    id: 'DET-2024-003',
    waybillNo: 'CAE-2024-001701',
    goodsName: '压缩氧气钢瓶 UN1072',
    declaredGoodsName: '工业气体',
    goodsCode: 'UN1072',
    detainTime: '2024-11-10T08:45:00+08:00',
    detainReason: 'name_mismatch',
    detainBasis:
      '依据《民航危险品运输管理规定》第276.89条，申报品名为"工业气体"但实际为压缩氧气（第2.2类危险品），且未提供气瓶安全检验合格证，包装标识不符合GB190要求',
    inspector: '王建军',
    receiver: '张伟',
    warehouseImpact: '货物暂存于危险品专用库区A-05位，需通风存放',
    status: 'returned',
    requiredDocs: [
      {
        id: 'rd-3-1',
        docName: '危险品申报单(正确品名)',
        description: '需以正确品名重新申报',
        isRequired: true,
      },
      {
        id: 'rd-3-2',
        docName: '气瓶安全检验合格证',
        description: '需提供气瓶安全检验合格证',
        isRequired: true,
      },
      {
        id: 'rd-3-3',
        docName: '压力容器使用登记证',
        description: '需提供压力容器使用登记证',
        isRequired: true,
      },
      {
        id: 'rd-3-4',
        docName: '包装符合性声明',
        description: '需提供包装符合性声明',
        isRequired: true,
      },
    ],
    originalDocs: [
      {
        docName: '运单',
        docNo: 'CAE-2024-001701',
        issueDate: '2024-11-09',
        status: 'mismatch',
        remark: '品名与实际不符',
      },
      {
        docName: '危险品申报单',
        docNo: '',
        issueDate: '',
        status: 'missing',
        remark: '未提供',
      },
    ],
    supplementaryDocs: [
      {
        id: 'sd-3-1',
        docName: '危险品申报单(正确品名)',
        uploadTime: '2024-11-11T10:30:00+08:00',
        uploadedBy: '张伟',
        fileName: '危险品申报单_正确品名.pdf',
        reviewStatus: 'approved',
        reviewComment: '申报单品名已更正为压缩氧气',
      },
      {
        id: 'sd-3-2',
        docName: '气瓶安全检验合格证',
        uploadTime: '2024-11-11T10:35:00+08:00',
        uploadedBy: '张伟',
        fileName: '气瓶安全检验合格证.pdf',
        reviewStatus: 'rejected',
        reviewComment: '证书编号与钢瓶编号不匹配，疑似套用其他气瓶证书',
      },
    ],
    reviews: [
      {
        id: 'rv-3-1',
        reviewer: '刘主任',
        reviewTime: '2024-11-12T14:00:00+08:00',
        opinion: 'approve',
        comment: '危险品申报单补证合格，建议放行',
      },
      {
        id: 'rv-3-2',
        reviewer: '赵国庆',
        reviewTime: '2024-11-12T16:30:00+08:00',
        opinion: 'reject',
        comment: '气瓶安全检验合格证存疑，证书编号与钢瓶编号不匹配',
      },
    ],
    finalResult: 'returned',
    finalResultTime: '2024-11-13T09:00:00+08:00',
    finalResultBy: '刘主任',
    finalResultComment:
      '补证材料审核未通过，气瓶安全检验合格证与货物无法对应，存在重大安全隐患，予以退回处理',
  },
]

export function getDetentions(): Detention[] {
  return detentions
}

export function saveDetention(d: Detention): void {
  const idx = detentions.findIndex((item) => item.id === d.id)
  if (idx >= 0) {
    detentions[idx] = d
  } else {
    detentions.push(d)
  }
}
