interface StatsCardProps {
  title: string;
  count: number;
  color: string;
  icon: string;
  onClick?: () => void;
}

export function StatsCard({ title, count, color, icon, onClick }: StatsCardProps) {
  return (
    <div
      style={{ ...styles.card, borderLeftColor: color }}
      onClick={onClick}
    >
      <div style={styles.cardIcon}>{icon}</div>
      <div style={styles.cardContent}>
        <span style={{ ...styles.count, color }}>{count}</span>
        <span style={styles.title}>{title}</span>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  card: {
    background: '#fff',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    borderLeft: '4px solid',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  cardIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: '#f5f7fa',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  count: {
    fontSize: '24px',
    fontWeight: 'bold',
  },
  title: {
    fontSize: '13px',
    color: '#666',
    marginTop: '4px',
  },
};
