class NeedsSearchApp {
    constructor() {
        this.needs = this.loadNeeds();
        this.currentFilter = 'all';
        this.votedIds = JSON.parse(localStorage.getItem('nizu_votes') || '[]');
        this.init();
    }

    loadNeeds() {
        const saved = localStorage.getItem('nizu_needs');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Merge with defaults to pick up any new entries
            const savedIds = new Set(parsed.map(n => n.id));
            const merged = [...parsed];
            for (const d of DEFAULT_NEEDS) {
                if (!savedIds.has(d.id)) merged.push(d);
            }
            return merged;
        }
        return [...DEFAULT_NEEDS];
    }

    saveNeeds() {
        localStorage.setItem('nizu_needs', JSON.stringify(this.needs));
    }

    init() {
        this.bindEvents();
        this.renderTrending();
        this.renderResults(this.needs);
        this.updateStats(this.needs);
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
    }

    search() {
        const query = document.getElementById('searchInput').value.trim().toLowerCase();
        let filtered = this.needs;

        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(n => n.category === this.currentFilter);
        }

        if (query) {
            filtered = filtered.filter(n =>
                n.title.toLowerCase().includes(query) ||
                n.description.toLowerCase().includes(query) ||
                n.tags.some(t => t.toLowerCase().includes(query)) ||
                CATEGORY_LABELS[n.category].includes(query)
            );
        }

        // Sort by votes descending
        filtered.sort((a, b) => b.votes - a.votes);

        this.renderResults(filtered);
        this.updateStats(filtered);
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
                    ${need.tags.map(t => `<span style="font-size:0.75rem;color:#6c5ce7;background:#1a1a3e;padding:0.2rem 0.5rem;border-radius:8px;">#${this.escapeHtml(t)}</span>`).join('')}
                </div>
                <div class="card-footer">
                    <span class="urgency">
                        緊急度: <span class="urgency-bar">${this.renderUrgency(need.urgency)}</span>
                    </span>
                    <button class="vote-btn ${this.votedIds.includes(need.id) ? 'voted' : ''}" data-id="${need.id}">
                        ${this.votedIds.includes(need.id) ? '共感済' : '共感する'} ${need.votes}
                    </button>
                </div>
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

    renderTrending() {
        const allTags = this.needs.flatMap(n => n.tags);
        const tagCount = {};
        allTags.forEach(t => { tagCount[t] = (tagCount[t] || 0) + 1; });
        const sorted = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 12);

        const container = document.getElementById('trendingTags');
        container.innerHTML = sorted.map(([tag]) =>
            `<span class="trend-tag" data-tag="${this.escapeHtml(tag)}">#${this.escapeHtml(tag)}</span>`
        ).join('');

        container.querySelectorAll('.trend-tag').forEach(el => {
            el.addEventListener('click', () => {
                document.getElementById('searchInput').value = el.dataset.tag;
                this.search();
            });
        });
    }

    updateStats(filtered) {
        document.getElementById('totalNeeds').textContent = this.needs.length;
        document.getElementById('searchCount').textContent = filtered.length;
    }

    vote(id) {
        const need = this.needs.find(n => n.id === id);
        if (!need) return;

        if (this.votedIds.includes(id)) {
            need.votes--;
            this.votedIds = this.votedIds.filter(v => v !== id);
        } else {
            need.votes++;
            this.votedIds.push(id);
        }

        localStorage.setItem('nizu_votes', JSON.stringify(this.votedIds));
        this.saveNeeds();
        this.search();
    }

    addNeed() {
        const title = document.getElementById('needTitle').value.trim();
        const description = document.getElementById('needDescription').value.trim();
        const category = document.getElementById('needCategory').value;
        const urgency = parseInt(document.getElementById('needUrgency').value);

        if (!title || !description || !category) return;

        const newNeed = {
            id: Date.now(),
            title,
            description,
            category,
            urgency,
            votes: 0,
            tags: this.extractTags(title + ' ' + description)
        };

        this.needs.unshift(newNeed);
        this.saveNeeds();

        document.getElementById('addNeedForm').reset();
        document.getElementById('urgencyLabel').textContent = '普通';

        this.renderTrending();
        this.search();
    }

    extractTags(text) {
        const keywords = ['健康', '仕事', 'お金', '投資', '転職', '副業', 'AI', 'プログラミング',
            'ダイエット', '睡眠', 'ストレス', '英語', '資格', '節約', '子育て', '時短',
            'リモート', 'メンタル', '運動', '勉強', '人間関係', 'スマホ', '料理', '美容'];
        const found = keywords.filter(k => text.includes(k));
        return found.length > 0 ? found.slice(0, 4) : ['その他'];
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
