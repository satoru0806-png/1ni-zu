const API = '/api';
const CATEGORY_LABELS = {
    health: '健康', work: '仕事・キャリア', money: 'お金',
    relationship: '人間関係', lifestyle: '生活', education: '学び', tech: 'テクノロジー'
};
const URGENCY_LABELS = ['', '低い', 'やや低い', '普通', 'やや高い', '高い'];

class NeedsSearchApp {
    constructor() {
        this.currentFilter = 'all';
        this.token = localStorage.getItem('nizu_token');
        this.user = JSON.parse(localStorage.getItem('nizu_user') || 'null');
        this.init();
    }

    async init() {
        this.bindEvents();
        this.updateAuthUI();
        await Promise.all([this.loadTrending(), this.search(), this.loadStats()]);
    }

    bindEvents() {
        document.getElementById('searchBtn').addEventListener('click', () => this.search());
        document.getElementById('searchInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.search();
        });
        document.getElementById('searchInput').addEventListener('input', () => this.search());

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.category;
                this.search();
            });
        });

        document.getElementById('addNeedForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addNeed();
        });

        const urgencyInput = document.getElementById('needUrgency');
        urgencyInput.addEventListener('input', () => {
            document.getElementById('urgencyLabel').textContent = URGENCY_LABELS[urgencyInput.value];
        });

        // Auth events
        document.getElementById('loginBtn').addEventListener('click', () => this.showAuthModal('login'));
        document.getElementById('registerBtn').addEventListener('click', () => this.showAuthModal('register'));
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        document.getElementById('modalClose').addEventListener('click', () => this.hideAuthModal());
        document.getElementById('authForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAuth();
        });
    }

    headers() {
        const h = { 'Content-Type': 'application/json' };
        if (this.token) h['Authorization'] = `Bearer ${this.token}`;
        return h;
    }

    // Auth
    showAuthModal(mode) {
        this.authMode = mode;
        document.getElementById('modalTitle').textContent = mode === 'login' ? 'ログイン' : 'アカウント登録';
        document.getElementById('authSubmit').textContent = mode === 'login' ? 'ログイン' : '登録';
        document.getElementById('authError').style.display = 'none';
        document.getElementById('authModal').style.display = 'flex';
    }

    hideAuthModal() {
        document.getElementById('authModal').style.display = 'none';
        document.getElementById('authForm').reset();
    }

    async handleAuth() {
        const username = document.getElementById('authUsername').value.trim();
        const password = document.getElementById('authPassword').value;
        const endpoint = this.authMode === 'login' ? '/auth/login' : '/auth/register';

        try {
            const res = await fetch(API + endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (!res.ok) {
                document.getElementById('authError').textContent = data.error;
                document.getElementById('authError').style.display = 'block';
                return;
            }

            this.token = data.token;
            this.user = data.user;
            localStorage.setItem('nizu_token', data.token);
            localStorage.setItem('nizu_user', JSON.stringify(data.user));
            this.updateAuthUI();
            this.hideAuthModal();
            this.search();
        } catch {
            document.getElementById('authError').textContent = 'サーバーに接続できません';
            document.getElementById('authError').style.display = 'block';
        }
    }

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('nizu_token');
        localStorage.removeItem('nizu_user');
        this.updateAuthUI();
        this.search();
    }

    updateAuthUI() {
        if (this.user) {
            document.getElementById('authArea').style.display = 'none';
            document.getElementById('userArea').style.display = 'flex';
            document.getElementById('usernameDisplay').textContent = this.user.username;
        } else {
            document.getElementById('authArea').style.display = 'flex';
            document.getElementById('userArea').style.display = 'none';
        }
    }

    // API calls
    async search() {
        const q = document.getElementById('searchInput').value.trim();
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        if (this.currentFilter !== 'all') params.set('category', this.currentFilter);

        try {
            const res = await fetch(`${API}/needs?${params}`, { headers: this.headers() });
            const needs = await res.json();
            this.renderResults(needs);
            document.getElementById('searchCount').textContent = needs.length;
        } catch {
            document.getElementById('results').innerHTML = '<p style="text-align:center;color:#666;grid-column:1/-1;padding:3rem;">サーバーに接続できません</p>';
        }
    }

    async loadStats() {
        try {
            const res = await fetch(`${API}/needs/stats`);
            const stats = await res.json();
            document.getElementById('totalNeeds').textContent = stats.totalNeeds;
        } catch {}
    }

    async loadTrending() {
        try {
            const res = await fetch(`${API}/needs/trending`);
            const tags = await res.json();
            const container = document.getElementById('trendingTags');
            container.innerHTML = tags.map(t =>
                `<span class="trend-tag" data-tag="${this.escapeHtml(t.name)}">#${this.escapeHtml(t.name)}</span>`
            ).join('');
            container.querySelectorAll('.trend-tag').forEach(el => {
                el.addEventListener('click', () => {
                    document.getElementById('searchInput').value = el.dataset.tag;
                    this.search();
                });
            });
        } catch {}
    }

    renderResults(needs) {
        const container = document.getElementById('results');
        if (needs.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:#666;grid-column:1/-1;padding:3rem;">該当するニーズが見つかりませんでした</p>';
            return;
        }

        container.innerHTML = needs.map(need => `
            <div class="need-card">
                <div class="card-header">
                    <h3>${this.escapeHtml(need.title)}</h3>
                    <span class="category-badge ${need.category}">${CATEGORY_LABELS[need.category]}</span>
                </div>
                <p>${this.escapeHtml(need.description)}</p>
                <div style="margin-bottom:0.8rem;display:flex;flex-wrap:wrap;gap:0.3rem;">
                    ${(need.tags || []).map(t => `<span style="font-size:0.75rem;color:#6c5ce7;background:#1a1a3e;padding:0.2rem 0.5rem;border-radius:8px;">#${this.escapeHtml(t)}</span>`).join('')}
                </div>
                <div class="card-footer">
                    <span class="urgency">
                        緊急度: <span class="urgency-bar">${this.renderUrgency(need.urgency)}</span>
                    </span>
                    <button class="vote-btn ${need.voted ? 'voted' : ''}" data-id="${need.id}">
                        ${need.voted ? '共感済' : '共感する'} ${need.votes}
                    </button>
                </div>
                ${need.username ? `<div style="margin-top:0.5rem;font-size:0.75rem;color:#666;">by ${this.escapeHtml(need.username)}</div>` : ''}
            </div>
        `).join('');

        container.querySelectorAll('.vote-btn').forEach(btn => {
            btn.addEventListener('click', () => this.vote(parseInt(btn.dataset.id)));
        });
    }

    renderUrgency(level) {
        return Array.from({ length: 5 }, (_, i) =>
            `<span class="urgency-dot ${i < level ? 'filled' : ''}"></span>`
        ).join('');
    }

    async vote(needId) {
        if (!this.token) {
            this.showAuthModal('login');
            return;
        }
        try {
            await fetch(`${API}/needs/${needId}/vote`, {
                method: 'POST',
                headers: this.headers()
            });
            this.search();
        } catch {}
    }

    async addNeed() {
        if (!this.token) {
            this.showAuthModal('login');
            return;
        }

        const title = document.getElementById('needTitle').value.trim();
        const description = document.getElementById('needDescription').value.trim();
        const category = document.getElementById('needCategory').value;
        const urgency = parseInt(document.getElementById('needUrgency').value);

        if (!title || !description || !category) return;

        const keywords = ['健康', '仕事', 'お金', '投資', '転職', '副業', 'AI', 'プログラミング',
            'ダイエット', '睡眠', 'ストレス', '英語', '資格', '節約', '子育て', '時短',
            'リモート', 'メンタル', '運動', '勉強', '人間関係', 'スマホ', '料理', '美容'];
        const text = title + ' ' + description;
        const tags = keywords.filter(k => text.includes(k)).slice(0, 4);
        if (tags.length === 0) tags.push('その他');

        try {
            const res = await fetch(`${API}/needs`, {
                method: 'POST',
                headers: this.headers(),
                body: JSON.stringify({ title, description, category, urgency, tags })
            });

            if (res.ok) {
                document.getElementById('addNeedForm').reset();
                document.getElementById('urgencyLabel').textContent = '普通';
                await Promise.all([this.search(), this.loadTrending(), this.loadStats()]);
            }
        } catch {}
    }

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new NeedsSearchApp();
});
