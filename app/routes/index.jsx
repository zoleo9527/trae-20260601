import { useState } from 'react';
import { redirect } from '@remix-run/node';
import { login } from '~/models/user.server';

export async function action({ request }) {
  const formData = await request.formData();
  const username = formData.get('username');
  const password = formData.get('password');
  
  const user = await login(username, password);
  
  if (user) {
    return redirect(`/dashboard/${user.role}`, {
      headers: {
        'Set-Cookie': `userId=${user.id}; Path=/; HttpOnly; SameSite=Lax`,
      },
    });
  }
  
  return { error: '用户名或密码错误' };
}

export default function LoginPage() {
  const [error, setError] = useState('');
  
  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>📦</div>
          <h1 style={styles.title}>建材仓配管理系统</h1>
          <p style={styles.subtitle}>送货签收与破损登记</p>
        </div>
        
        <form method="post" style={styles.form} onSubmit={(e) => {
          setError('');
        }}>
          <div style={styles.formGroup}>
            <label style={styles.label}>用户名</label>
            <input
              type="text"
              name="username"
              placeholder="请输入用户名"
              style={styles.input}
              required
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>密码</label>
            <input
              type="password"
              name="password"
              placeholder="请输入密码"
              style={styles.input}
              required
            />
          </div>
          
          {error && <p style={styles.error}>{error}</p>}
          
          <button type="submit" style={styles.loginBtn}>
            登 录
          </button>
        </form>
        
        <div style={styles.quickAccess}>
          <p style={styles.quickTitle}>快速登录</p>
          <div style={styles.roleButtons}>
            <button
              formMethod="post"
              formAction="/"
              onClick={(e) => {
                e.preventDefault();
                document.querySelector('input[name="username"]').value = 'warehouse';
                document.querySelector('input[name="password"]').value = '123456';
                document.querySelector('form').submit();
              }}
              style={styles.roleBtn}
            >
              🏭 仓库主管
            </button>
            <button
              formMethod="post"
              formAction="/"
              onClick={(e) => {
                e.preventDefault();
                document.querySelector('input[name="username"]').value = 'driver';
                document.querySelector('input[name="password"]').value = '123456';
                document.querySelector('form').submit();
              }}
              style={styles.roleBtn}
            >
              🚛 司机
            </button>
            <button
              formMethod="post"
              formAction="/"
              onClick={(e) => {
                e.preventDefault();
                document.querySelector('input[name="username"]').value = 'customer';
                document.querySelector('input[name="password"]').value = '123456';
                document.querySelector('form').submit();
              }}
              style={styles.roleBtn}
            >
              📞 客服
            </button>
          </div>
        </div>
        
        <div style={styles.credentials}>
          <p>测试账号：warehouse/driver/customer | 密码：123456</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  loginBox: {
    background: '#fff',
    borderRadius: '16px',
    padding: '40px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
    width: '400px',
    maxWidth: '90%',
  },
  logo: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  logoIcon: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  title: {
    fontSize: '24px',
    color: '#1a1a2e',
    margin: '0 0 8px',
    fontWeight: '600',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: '0',
  },
  form: {
    marginBottom: '20px',
  },
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    color: '#333',
    marginBottom: '6px',
    fontWeight: '500',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  error: {
    color: '#e74c3c',
    fontSize: '13px',
    margin: '0 0 12px',
    textAlign: 'center',
  },
  loginBtn: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  quickAccess: {
    borderTop: '1px solid #eee',
    paddingTop: '20px',
    marginBottom: '20px',
  },
  quickTitle: {
    fontSize: '14px',
    color: '#666',
    textAlign: 'center',
    margin: '0 0 12px',
  },
  roleButtons: {
    display: 'flex',
    gap: '10px',
  },
  roleBtn: {
    flex: 1,
    padding: '10px 12px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    background: '#fafafa',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  credentials: {
    textAlign: 'center',
    fontSize: '12px',
    color: '#999',
  },
};
