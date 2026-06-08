<script lang="ts">
	let { data, form } = $props();

	let username = $state('');
	let password = $state('');

	function fillDemo(user: string, pass: string) {
		username = user;
		password = pass;
	}
</script>

<div class="login-container">
	<div class="login-card">
		<h2>网咖电竞馆</h2>
		<p class="login-subtitle">会员充值与时长赠送管理系统</p>

		{#if form?.error}
			<div class="alert alert-danger">{form.error}</div>
		{/if}

		<form method="POST">
			<div class="form-group">
				<label for="username">用户名</label>
				<input id="username" name="username" type="text" bind:value={username} placeholder="请输入用户名" required />
			</div>
			<div class="form-group">
				<label for="password">密码</label>
				<input id="password" name="password" type="password" bind:value={password} placeholder="请输入密码" required />
			</div>
			<button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;margin-top:8px;">登录</button>
		</form>

		<div class="demo-accounts">
			<h4>演示账号（点击自动填入）</h4>
			<div class="demo-account-item" onclick={() => fillDemo('wang', '123456')}>
				<span>网管小王</span>
				<span style="color:var(--c-text-2);font-size:12px">wang / 123456</span>
			</div>
			<div class="demo-account-item" onclick={() => fillDemo('li', '123456')}>
				<span>赛事运营小李</span>
				<span style="color:var(--c-text-2);font-size:12px">li / 123456</span>
			</div>
			<div class="demo-account-item" onclick={() => fillDemo('zhao', '123456')}>
				<span>店长老赵</span>
				<span style="color:var(--c-text-2);font-size:12px">zhao / 123456</span>
			</div>
		</div>
	</div>
</div>
