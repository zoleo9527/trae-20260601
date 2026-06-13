<script lang="ts">
	let username = '';
	let password = '';
	let error = '';
	let loading = false;

	async function login() {
		if (!username || !password) {
			error = '请输入用户名和密码';
			return;
		}

		loading = true;
		error = '';

		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password })
			});

			const data = await res.json();

			if (data.success) {
				window.location.href = '/';
			} else {
				error = data.error || '登录失败';
			}
		} catch (e) {
			error = '网络错误，请稍后重试';
		}

		loading = false;
	}
</script>

<div class="login-container">
	<div class="login-card">
		<h1>税务风险跟踪系统</h1>
		<p class="subtitle">风险提示与后续跟踪管理平台</p>

		<form on:submit|preventDefault={login}>
			<div class="form-group">
				<label class="label" for="username">用户名（工号）</label>
				<input
					id="username"
					class="input"
					type="text"
					placeholder="例如：TA001、PM001、CF001"
					bind:value={username}
					disabled={loading}
				/>
			</div>

			<div class="form-group">
				<label class="label" for="password">密码</label>
				<input
					id="password"
					class="input"
					type="password"
					placeholder="password123"
					bind:value={password}
					disabled={loading}
				/>
			</div>

			{#if error}
				<div class="error-message">{error}</div>
			{/if}

			<button class="btn btn-primary btn-block" type="submit" disabled={loading}>
				{#if loading}
					登录中...
				{:else}
					登录
				{/if}
			</button>
		</form>

		<div class="demo-users">
			<p class="demo-title">测试账号：</p>
			<div class="demo-list">
				<div class="demo-item">
					<strong>TA001</strong> - 张税务（税务顾问）
				</div>
				<div class="demo-item">
					<strong>PM001</strong> - 李经理（项目经理）
				</div>
				<div class="demo-item">
					<strong>CF001</strong> - 王财务（客户财务）
				</div>
			</div>
			<p class="demo-note">密码均为：password123</p>
		</div>
	</div>
</div>

<style>
	.login-container {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 100vh;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}

	.login-card {
		background: var(--card-bg);
		border-radius: 0.75rem;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
		padding: 2.5rem;
		width: 100%;
		max-width: 400px;
	}

	h1 {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0 0 0.5rem 0;
		text-align: center;
	}

	.subtitle {
		font-size: 0.875rem;
		color: var(--text-secondary);
		text-align: center;
		margin: 0 0 2rem 0;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.error-message {
		background: #fee2e2;
		color: #991b1b;
		padding: 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		margin-bottom: 1rem;
	}

	.btn-block {
		width: 100%;
		padding: 0.75rem;
		font-size: 1rem;
	}

	.demo-users {
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--border-color);
	}

	.demo-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 0.75rem 0;
	}

	.demo-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.demo-item {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}

	.demo-item strong {
		color: var(--primary-color);
	}

	.demo-note {
		font-size: 0.75rem;
		color: var(--text-secondary);
		margin: 0.75rem 0 0 0;
		font-style: italic;
	}
</style>