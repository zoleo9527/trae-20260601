interface ButtonProps {
  children: React.ReactNode;
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  className?: string;
}

export function Button({ children, onClick, variant = 'primary', size = 'medium', disabled = false, className = '' }: ButtonProps) {
  const baseStyles = {
    padding: size === 'small' ? '6px 12px' : size === 'large' ? '12px 24px' : '8px 16px',
    fontSize: size === 'small' ? '12px' : size === 'large' ? '16px' : '14px',
    border: 'none',
    borderRadius: '4px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: '500',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px'
  };

  const variantStyles = {
    primary: {
      backgroundColor: '#4080ff',
      color: '#fff',
      '&:hover:not(:disabled)': { backgroundColor: '#3070ef' },
      '&:active:not(:disabled)': { backgroundColor: '#2060df' }
    },
    secondary: {
      backgroundColor: '#f0f2f5',
      color: '#333',
      '&:hover:not(:disabled)': { backgroundColor: '#e0e2e5' },
      '&:active:not(:disabled)': { backgroundColor: '#d0d2d5' }
    },
    danger: {
      backgroundColor: '#ff4d4f',
      color: '#fff',
      '&:hover:not(:disabled)': { backgroundColor: '#ef3d3f' },
      '&:active:not(:disabled)': { backgroundColor: '#df2d2f' }
    },
    success: {
      backgroundColor: '#52c41a',
      color: '#fff',
      '&:hover:not(:disabled)': { backgroundColor: '#42b40a' },
      '&:active:not(:disabled)': { backgroundColor: '#32a400' }
    }
  };

  const disabledStyles = {
    opacity: 0.5,
    cursor: 'not-allowed'
  };

  const mergedStyles = { ...baseStyles, ...variantStyles[variant], ...(disabled ? disabledStyles : {}) };

  return (
    <button
      style={mergedStyles}
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </button>
  );
}

interface InputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

export function Input({ type = 'text', placeholder, value, onChange, className = '' }: InputProps) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      style={{
        padding: '8px 12px',
        border: '1px solid #d9d9d9',
        borderRadius: '4px',
        fontSize: '14px',
        outline: 'none',
        transition: 'border-color 0.2s'
      }}
      className={className}
    />
  );
}

interface SelectProps {
  options: { value: string; label: string }[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function Select({ options, value, onChange, placeholder, className = '' }: SelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      style={{
        padding: '8px 12px',
        border: '1px solid #d9d9d9',
        borderRadius: '4px',
        fontSize: '14px',
        outline: 'none',
        transition: 'border-color 0.2s',
        cursor: 'pointer',
        backgroundColor: '#fff'
      }}
      className={className}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

interface TableProps {
  columns: { key: string; label: string; width?: string }[];
  data: Record<string, React.ReactNode>[];
  rowKey: string;
  onRowClick?: (record: Record<string, React.ReactNode>) => void;
  selectedKeys?: string[];
  onSelect?: (key: string, checked: boolean) => void;
  pagination?: { current: number; total: number };
  children?: React.ReactNode;
}

export function Table({ columns, data, rowKey, onRowClick, selectedKeys = [], onSelect, pagination }: TableProps) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
        <thead>
          <tr style={{ backgroundColor: '#fafafa' }}>
            {onSelect && (
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e8e8e8', width: '40px' }}>
                <input
                  type="checkbox"
                  onChange={(e) => {
                    const checked = e.target.checked;
                    data.forEach(row => onSelect?.(String(row[rowKey]), checked));
                  }}
                  checked={data.length > 0 && data.every(row => selectedKeys.includes(String(row[rowKey])))}
                />
              </th>
            )}
            {columns.map(col => (
              <th key={col.key} style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e8e8e8', width: col.width }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr
              key={String(row[rowKey])}
              onClick={() => onRowClick?.(row)}
              style={{ 
                borderBottom: '1px solid #e8e8e8', 
                cursor: onRowClick ? 'pointer' : 'default',
                backgroundColor: selectedKeys.includes(String(row[rowKey])) ? '#e6f7ff' : '#fff'
              }}
            >
              {onSelect && (
                <td style={{ padding: '12px' }}>
                  <input
                    type="checkbox"
                    checked={selectedKeys.includes(String(row[rowKey]))}
                    onChange={(e) => onSelect(String(row[rowKey]), e.target.checked)}
                  />
                </td>
              )}
              {columns.map(col => (
                <td key={col.key} style={{ padding: '12px' }}>
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {pagination && (
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#666' }}>
            共 {pagination.total} 条记录
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" size="small">上一页</Button>
            <span style={{ padding: '0 12px', fontSize: '14px' }}>{pagination.current}</span>
            <Button variant="secondary" size="small">下一页</Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Card({ title, children, className = '', style }: CardProps) {
  return (
    <div style={{ 
      backgroundColor: '#fff', 
      borderRadius: '8px', 
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      padding: '16px',
      marginBottom: '16px',
      ...style
    }} className={className}>
      {title && (
        <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

interface BadgeProps {
  children: React.ReactNode;
  color?: 'red' | 'orange' | 'yellow' | 'green' | 'blue';
}

export function Badge({ children, color = 'blue' }: BadgeProps) {
  const colors = {
    red: '#ff4d4f',
    orange: '#fa8c16',
    yellow: '#faad14',
    green: '#52c41a',
    blue: '#1890ff'
  };

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        fontSize: '12px',
        borderRadius: '10px',
        backgroundColor: colors[color],
        color: '#fff'
      }}
    >
      {children}
    </span>
  );
}
