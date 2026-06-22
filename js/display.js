// =============================================
//  CineMatch Pro — display.js
//  Responsável pela videoteca e estatísticas
// =============================================

// ─── Storage (duplicado para independência) ──
const Storage = {
  KEY: 'cinematch_filmes',
  getAll() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) ?? []; } catch { return []; }
  },
  save(lista) { localStorage.setItem(this.KEY, JSON.stringify(lista)); },
  remove(id) {
    const lista = this.getAll().filter(f => f.id !== id);
    this.save(lista);
  }
};

// ─── Render de Cards ─────────────────────────
function criarCard(filme) {
  const art = document.createElement('article');
  art.className = 'card';
  art.dataset.id = filme.id;

  const estrelas = filme.nota ? '★'.repeat(Math.round(filme.nota / 2)) : '';

  art.innerHTML = `
    <div class="card-poster">
      ${filme.capa
        ? `<img src="${filme.capa}" alt="Capa do filme ${filme.titulo}" loading="lazy">`
        : `<div class="card-poster-fallback" aria-label="Sem capa disponível">🎬</div>`
      }
      <div class="card-badge">${filme.ano || '—'}</div>
      ${filme.trailer
        ? `<div class="card-overlay">
             <button class="btn-trailer" data-trailer="${filme.trailer}" data-titulo="${filme.titulo}" aria-label="Assistir trailer de ${filme.titulo}">
               ▶ Trailer
             </button>
           </div>`
        : ''
      }
    </div>
    <div class="card-body">
      <h2 class="card-title" title="${filme.titulo}">${filme.titulo}</h2>
      <div class="card-meta">
        ${filme.genero ? `<span class="tag genre">${filme.genero}</span>` : ''}
        ${filme.duracao ? `<span class="tag">${filme.duracao} min</span>` : ''}
      </div>
      ${filme.sinopse ? `<p class="card-sinopse">${filme.sinopse}</p>` : ''}
      <div class="card-footer">
        <span class="rating" aria-label="Nota: ${filme.nota} de 10">
          ${estrelas || '—'}
          <span style="color: var(--clr-muted); font-weight: 400; font-size: .72rem">${filme.nota ? `${filme.nota}/10` : ''}</span>
        </span>
        <button class="btn btn-danger btn-remover" data-id="${filme.id}" aria-label="Remover ${filme.titulo} do catálogo">
          🗑 Remover
        </button>
      </div>
    </div>
  `;

  return art;
}

// ─── Renderiza a grade de filmes ─────────────
function renderizarCatalogo(lista) {
  const grid = document.getElementById('cards-grid');
  if (!grid) return;

  grid.innerHTML = '';

  if (lista.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🎞️</span>
        <h3>Nenhum filme encontrado</h3>
        <p>Adicione filmes na página de cadastro ou ajuste o filtro.</p>
      </div>`;
    return;
  }

  lista.forEach(filme => grid.appendChild(criarCard(filme)));

  // Eventos: trailer
  grid.querySelectorAll('.btn-trailer').forEach(btn => {
    btn.addEventListener('click', () => {
      abrirModal(btn.dataset.trailer, btn.dataset.titulo);
    });
  });

  // Eventos: remover
  grid.querySelectorAll('.btn-remover').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      Storage.remove(id);
      atualizarTudo();
    });
  });
}

// ─── Filtro e busca ───────────────────────────
function getFiltrado() {
  const busca  = document.getElementById('busca')?.value.toLowerCase() ?? '';
  const genero = document.getElementById('filtro-genero')?.value ?? '';
  const ordem  = document.getElementById('filtro-ordem')?.value ?? '';

  let lista = Storage.getAll();

  if (busca)  lista = lista.filter(f => f.titulo.toLowerCase().includes(busca));
  if (genero) lista = lista.filter(f => f.genero === genero);

  if (ordem === 'nota-desc')  lista.sort((a, b) => b.nota - a.nota);
  if (ordem === 'nota-asc')   lista.sort((a, b) => a.nota - b.nota);
  if (ordem === 'ano-desc')   lista.sort((a, b) => (b.ano || 0) - (a.ano || 0));
  if (ordem === 'titulo-az')  lista.sort((a, b) => a.titulo.localeCompare(b.titulo));
  if (ordem === 'recente')    lista.sort((a, b) => b.addedAt?.localeCompare(a.addedAt ?? ''));

  return lista;
}

// ─── Estatísticas ─────────────────────────────
function calcularEstatisticas(lista) {
  // Total de minutos usando .reduce()
  const totalMinutos = lista.reduce((acc, f) => acc + (Number(f.duracao) || 0), 0);
  const totalHoras   = Math.floor(totalMinutos / 60);
  const minutosRest  = totalMinutos % 60;

  // Nota média
  const comNota = lista.filter(f => f.nota > 0);
  const notaMedia = comNota.length
    ? (comNota.reduce((acc, f) => acc + Number(f.nota), 0) / comNota.length).toFixed(1)
    : '—';

  // Contagem por gênero
  const porGenero = lista.reduce((acc, f) => {
    if (f.genero) acc[f.genero] = (acc[f.genero] || 0) + 1;
    return acc;
  }, {});

  return { totalMinutos, totalHoras, minutosRest, notaMedia, porGenero };
}

function renderizarEstatisticas(lista) {
  const stats = calcularEstatisticas(lista);

  // Total de filmes
  const elTotal = document.getElementById('stat-total');
  if (elTotal) elTotal.textContent = lista.length;

  // Total de horas
  const elHoras = document.getElementById('stat-horas');
  if (elHoras) elHoras.textContent = `${stats.totalHoras}h ${stats.minutosRest}min`;

  // Nota média
  const elNota = document.getElementById('stat-nota');
  if (elNota) elNota.textContent = stats.notaMedia;

  // Gêneros
  const generoList = document.getElementById('genre-list');
  if (!generoList) return;

  generoList.innerHTML = '';
  const max = Math.max(...Object.values(stats.porGenero), 1);

  Object.entries(stats.porGenero)
    .sort((a, b) => b[1] - a[1])
    .forEach(([genero, count]) => {
      const pct = Math.round((count / max) * 100);
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${genero}</span>
        <span class="genre-count">${count}</span>
        <div class="genre-bar" aria-hidden="true">
          <div class="genre-bar-fill" style="width: ${pct}%"></div>
        </div>`;
      generoList.appendChild(li);
    });
}

// ─── Popula select de gênero ──────────────────
function popularFiltroGenero() {
  const sel = document.getElementById('filtro-genero');
  if (!sel) return;

  const generos = [...new Set(Storage.getAll().map(f => f.genero).filter(Boolean))].sort();
  sel.innerHTML = '<option value="">Todos os gêneros</option>';
  generos.forEach(g => {
    const opt = document.createElement('option');
    opt.value = g;
    opt.textContent = g;
    sel.appendChild(opt);
  });
}

// ─── Modal de Trailer ─────────────────────────
function abrirModal(youtubeId, titulo) {
  const overlay = document.getElementById('modal-overlay');
  const iframe  = document.getElementById('modal-iframe');
  const titulo_ = document.getElementById('modal-titulo');

  if (!overlay || !iframe) return;

  titulo_.textContent = titulo || 'Trailer';
  iframe.src = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function fecharModal() {
  const overlay = document.getElementById('modal-overlay');
  const iframe  = document.getElementById('modal-iframe');

  if (!overlay) return;
  overlay.classList.remove('open');
  iframe.src = '';
  document.body.style.overflow = '';
}

// ─── Atualiza tudo ────────────────────────────
function atualizarTudo() {
  const lista = getFiltrado();
  renderizarCatalogo(lista);
  renderizarEstatisticas(Storage.getAll());
  popularFiltroGenero();
}

// ─── Init ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  atualizarTudo();

  // Filtros e busca
  document.getElementById('busca')?.addEventListener('input', atualizarTudo);
  document.getElementById('filtro-genero')?.addEventListener('change', atualizarTudo);
  document.getElementById('filtro-ordem')?.addEventListener('change', atualizarTudo);

  // Modal
  document.getElementById('modal-overlay')?.addEventListener('click', e => {
    if (e.target.id === 'modal-overlay') fecharModal();
  });
  document.getElementById('btn-fechar-modal')?.addEventListener('click', fecharModal);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') fecharModal();
  });
});
