import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Select, Card, Row, Col, Tag, Button, Spin, Empty } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { propertyAPI } from '../services/api';
import { Property, PropertyStatus, decorationNames } from '../types';

const getStatusDisplay = (status: PropertyStatus): { label: string; color: string } => {
  const statusMap: Record<PropertyStatus, { label: string; color: string }> = {
    vacant: { label: '空置', color: '#52c41a' },
    viewing_scheduled: { label: '预约看房', color: '#1890ff' },
    viewing_completed: { label: '看房完成', color: '#13c2c2' },
    quotation_pending: { label: '待报价', color: '#faad14' },
    quotation_submitted: { label: '已报价待确认', color: '#fa8c16' },
    quotation_approved: { label: '报价已确认', color: '#722ed1' },
    contract_drafting: { label: '合同起草中', color: '#1890ff' },
    contract_reviewing: { label: '合同审核中', color: '#722ed1' },
    contract_signed: { label: '合同已签署', color: '#52c41a' },
    handover_pending: { label: '待交接', color: '#faad14' },
    handover_completed: { label: '交接完成', color: '#52c41a' },
    occupied: { label: '已入住', color: '#52c41a' },
    checkout_pending: { label: '待退租', color: '#fa8c16' },
    checkout_completed: { label: '已退租', color: '#8c8c8c' },
  };
  return statusMap[status] || { label: status, color: '#d9d9d9' };
};

const statusOptions = Object.entries({
  vacant: '空置',
  viewing_scheduled: '预约看房',
  viewing_completed: '看房完成',
  quotation_pending: '待报价',
  quotation_submitted: '已报价待确认',
  quotation_approved: '报价已确认',
  contract_drafting: '合同起草中',
  contract_reviewing: '合同审核中',
  contract_signed: '合同已签署',
  handover_pending: '待交接',
  handover_completed: '交接完成',
  occupied: '已入住',
  checkout_pending: '待退租',
  checkout_completed: '已退租',
} as const).map(([value, label]) => ({ value, label }));

const floorOptions = ['1F', '2F', '3F', '4F', '5F', '6F', '7F', '8F', '9F', '10F'].map((floor) => ({
  value: floor,
  label: floor,
}));

const buildingOptions = ['A座', 'B座', 'C座'].map((building) => ({
  value: building,
  label: building,
}));

const PropertyList = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [building, setBuilding] = useState<string>('');
  const [floor, setFloor] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [keyword, setKeyword] = useState<string>('');

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const params: { building?: string; status?: string; floor?: string } = {};
      if (building) params.building = building;
      if (floor) params.floor = floor;
      if (status) params.status = status;

      const response = await propertyAPI.list(params);
      let data = response.data;

      if (keyword) {
        data = data.filter(
          (p) =>
            p.roomNumber.includes(keyword) ||
            p.building.includes(keyword) ||
            p.floor.includes(keyword)
        );
      }

      setProperties(data);
    } catch (error) {
      console.error('Failed to fetch properties:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [building, floor, status]);

  const handleSearch = () => {
    fetchProperties();
  };

  const handleReset = () => {
    setBuilding('');
    setFloor('');
    setStatus('');
    setKeyword('');
  };

  const handleCardClick = (id: string) => {
    navigate(`/properties/${id}`);
  };

  const renderPropertyCard = (property: Property) => {
    const statusDisplay = property.statusDisplay || getStatusDisplay(property.status);
    const location = `${property.building} ${property.floor} ${property.roomNumber}`;

    return (
      <Col xs={24} sm={12} lg={8} xl={6} key={property.id}>
        <Card
          className="property-card"
          hoverable
          onClick={() => handleCardClick(property.id)}
        >
          <div className="property-card-header">
            <div>
              <h3 className="property-title">{location}</h3>
              <div style={{ marginTop: 4 }}>
                <Tag color={statusDisplay.color}>{statusDisplay.label}</Tag>
              </div>
            </div>
            <div className="property-price">¥{property.unitPrice}/㎡</div>
          </div>

          <div className="property-info">
            <span>面积：{property.area}㎡</span>
            <span>装修：{decorationNames[property.decoration]}</span>
            <span>朝向：{property.orientation}</span>
          </div>

          {property.facilities && property.facilities.length > 0 && (
            <div className="property-facilities">
              {property.facilities.map((facility, index) => (
                <span key={index} className="facility-tag">
                  {facility}
                </span>
              ))}
            </div>
          )}
        </Card>
      </Col>
    );
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">房源管理</h1>
      </div>

      <div className="filter-bar">
        <Input
          placeholder="搜索房源位置"
          prefix={<SearchOutlined />}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onPressEnter={handleSearch}
          style={{ width: 200 }}
        />
        <Select
          placeholder="选择楼宇"
          value={building || undefined}
          onChange={setBuilding}
          allowClear
          style={{ width: 150 }}
          options={buildingOptions}
        />
        <Select
          placeholder="选择楼层"
          value={floor || undefined}
          onChange={setFloor}
          allowClear
          style={{ width: 150 }}
          options={floorOptions}
        />
        <Select
          placeholder="选择状态"
          value={status || undefined}
          onChange={setStatus}
          allowClear
          style={{ width: 180 }}
          options={statusOptions}
        />
        <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
          搜索
        </Button>
        <Button icon={<ReloadOutlined />} onClick={handleReset}>
          重置
        </Button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
        </div>
      ) : properties.length > 0 ? (
        <Row gutter={[16, 16]}>{properties.map(renderPropertyCard)}</Row>
      ) : (
        <Empty description="暂无房源数据" />
      )}
    </div>
  );
};

export default PropertyList;
